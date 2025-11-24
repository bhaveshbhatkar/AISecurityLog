"""
Celery worker: Embeddings-based anomaly detection with rule-based hybrid scoring.
Uses Ollama for embeddings and Faiss for similarity search.
"""

import logging
import asyncio
from collections import Counter
from datetime import datetime
from typing import List, Tuple

import numpy as np
from celery import shared_task
from sqlalchemy import insert

from shared.db import AsyncSessionLocal
from shared.models import Event, Anomaly
from shared.schemas import ParsedEvent
from worker.parsers.deterministic import parse_line_deterministic
from worker.detectors.rules import (
    rule_high_request_rate,
    rule_unusual_method,
    rule_suspicious_user_agent,
    rule_large_transfer,
)
from worker.llm import explain_anomaly_with_llm
from worker.embeddings import (
    generate_embeddings_batch,
    prepare_log_text,
    is_zero_vector,
    FaissVectorStore
)
from worker.config import (
    ANOMALY_SCORE_THRESHOLD,
    DISTANCE_THRESHOLD,
    MIN_NEIGHBORS_FOR_COMPARISON,
    EMBEDDING_BATCH_SIZE,
    ML_SCALE,
    LOG_EMBEDDINGS_PROGRESS
)

logger = logging.getLogger("worker.embeddings_detection")


# -----------------------------
# Celery wrapper (sync -> async)
# -----------------------------
@shared_task(name="tasks.parse_file")
def parse_file_task(upload_id: str, file_path: str):
    """
    Celery entrypoint. Creates a fresh event loop per task.
    """
    try:
        # Create and set event loop BEFORE any async operations
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Run the async function
        loop.run_until_complete(process_file(upload_id, file_path))
    except Exception:
        logger.exception("parse_file_task failed")
    finally:
        # Clean up loop
        try:
            loop.close()
        except:
            pass


# -----------------------------
# Main async flow (embeddings-based)
# -----------------------------
async def process_file(upload_id: str, file_path: str):
    logger.info("Starting embeddings-based detection for upload_id=%s file=%s", upload_id, file_path)

    # Read file lines
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
            lines = fh.readlines()
    except Exception:
        logger.exception("Failed to read file: %s", file_path)
        return

    # Parse lines
    parsed_events: List[ParsedEvent] = []

    for line in lines:
        if not line.strip():
            continue
        parsed = parse_line_deterministic(line)
        if parsed is None:
            logger.debug("Skipping unparseable line: %s", line.strip())
            continue

        parsed_events.append(parsed)

    if not parsed_events:
        logger.info("No parseable events found in upload %s - finishing.", upload_id)
        return

    logger.info(f"Parsed {len(parsed_events)} events from upload {upload_id}")

    # -------------------------
    # Compute IP counts for rule-based detection
    # -------------------------
    src_ips = [e.src_ip for e in parsed_events if e and e.src_ip]
    ip_counter = Counter(src_ips)

    # -------------------------
    # Generate embeddings
    # -------------------------
    logger.info("Generating embeddings for %d events...", len(parsed_events))
    
    # Prepare texts for embedding
    texts = [prepare_log_text(event) for event in parsed_events]
    
    # Generate embeddings in batches
    all_embeddings = []
    for i in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch_texts = texts[i:i + EMBEDDING_BATCH_SIZE]
        batch_embeddings = await generate_embeddings_batch(batch_texts, batch_size=10)
        all_embeddings.extend(batch_embeddings)
        
        if LOG_EMBEDDINGS_PROGRESS:
            logger.info(f"Generated embeddings for {min(i + EMBEDDING_BATCH_SIZE, len(texts))}/{len(texts)} events")
    
    embeddings = np.array(all_embeddings, dtype=np.float32)
    logger.info(f"Generated {len(embeddings)} embeddings with shape {embeddings.shape}")

    # -------------------------
    # Load Faiss vector store
    # -------------------------
    try:
        vector_store = FaissVectorStore.load()
        logger.info("Loaded Faiss index: %s", vector_store.get_stats())
    except Exception:
        logger.exception("Failed to load Faiss index, creating new one")
        vector_store = FaissVectorStore()

    # -------------------------
    # Score events and collect DB batches
    # -------------------------
    batch_events = []
    batch_anomalies = []

    for idx, (parsed, embedding) in enumerate(zip(parsed_events, embeddings)):
        # Skip if embedding generation failed
        if is_zero_vector(embedding):
            logger.warning(f"Skipping event {idx} due to failed embedding generation")
            embedding_score = 0.0
        else:
            # Search for nearest neighbors
            distances, indices = vector_store.search(embedding.reshape(1, -1), k=MIN_NEIGHBORS_FOR_COMPARISON)
            
            if distances.shape[1] == 0:
                # No neighbors yet (first upload)
                embedding_score = 0.0
                logger.debug(f"Event {idx}: No neighbors in index yet")
            else:
                # Calculate average distance
                avg_distance = distances[0].mean()
                
                # Convert distance to anomaly score
                # Higher distance = more anomalous
                if avg_distance > DISTANCE_THRESHOLD:
                    # Normalize to [0, 1] range
                    embedding_score = min(1.0, avg_distance / (DISTANCE_THRESHOLD * 2))
                else:
                    embedding_score = 0.0
                
                logger.debug(
                    f"Event {idx}: avg_distance={avg_distance:.3f}, "
                    f"embedding_score={embedding_score:.3f}"
                )

        # -------------------------
        # Rule-based detection
        # -------------------------
        sliding_count = ip_counter.get(parsed.src_ip, 0)
        rule_results: List[Tuple[float, str]] = []

        for is_hit, score, reason in [
            rule_high_request_rate(sliding_count),
            rule_unusual_method(parsed.method),
            rule_suspicious_user_agent(parsed.user_agent),
            rule_large_transfer(parsed.bytes),
        ]:
            if is_hit:
                rule_results.append((score, reason or "rule_triggered"))

        if rule_results:
            best_rule_score, best_reason = max(rule_results, key=lambda r: r[0])
        else:
            best_rule_score, best_reason = 0.0, None

        # Hybrid final score: max of rules and scaled embeddings
        final_score = max(best_rule_score, embedding_score * ML_SCALE)

        # Prepare event record for DB
        event_record = {
            "upload_id": upload_id,
            "timestamp": parsed.timestamp if isinstance(parsed.timestamp, (str, datetime)) else (parsed.timestamp or None),
            "src_ip": parsed.src_ip,
            "dest_ip": parsed.dest_ip,
            "user_agent": parsed.user_agent,
            "username": parsed.username,
            "url": parsed.url,
            "method": parsed.method,
            "status": parsed.status,
            "bytes": parsed.bytes,
            "raw_line": parsed.raw_line,
        }
        batch_events.append(event_record)

        # If anomalous, create anomaly record
        if final_score > ANOMALY_SCORE_THRESHOLD:
            try:
                # Determine detector type
                if embedding_score > best_rule_score:
                    detector = "embeddings"
                    base_reason = f"Unusual pattern detected (distance: {avg_distance if not is_zero_vector(embedding) else 'N/A'})"
                else:
                    detector = "rule_based"
                    base_reason = best_reason or "Rule triggered"
                
                # Generate LLM explanation
                explanation = explain_anomaly_with_llm(
                    event_record,
                    rules=[base_reason],
                    ml_score=embedding_score,
                    final_score=final_score,
                )
            except Exception:
                logger.exception("LLM explanation failed for index=%d", idx)
                explanation = base_reason if 'base_reason' in locals() else "Anomaly detected"

            anomaly_record = {
                "event_id": idx,  # temporary mapping
                "detector": detector,
                "score": str(final_score),
                "reason": explanation,
            }
            batch_anomalies.append(anomaly_record)

    # -------------------------
    # Insert events in a single batch
    # -------------------------
    async with AsyncSessionLocal() as db:
        try:
            if batch_events:
                stmt = insert(Event).values(batch_events).returning(Event.id)
                res = await db.execute(stmt)
                event_ids = res.scalars().all()
                await db.commit()
            else:
                event_ids = []
        except Exception:
            logger.exception("Failed inserting events into DB")
            await db.rollback()
            return

        # Map anomalies' temporary event_index -> real event_id
        for anomaly in batch_anomalies:
            tmp_index = anomaly.pop("event_id", None)
            if tmp_index is None:
                continue
            try:
                anomaly["event_id"] = event_ids[int(tmp_index)]
            except Exception:
                logger.exception("Failed mapping anomaly event_index=%s", tmp_index)
                anomaly["event_id"] = None

        # Insert anomalies
        if batch_anomalies:
            try:
                stmt2 = insert(Anomaly).values(batch_anomalies)
                await db.execute(stmt2)
                await db.commit()
            except Exception:
                logger.exception("Failed inserting anomalies into DB")
                await db.rollback()

    # -------------------------
    # Update Faiss index with new embeddings
    # -------------------------
    try:
        # Prepare metadata for new embeddings
        metadata = [
            {
                'event_id': event_id,
                'upload_id': upload_id,
                'timestamp': str(parsed_events[i].timestamp) if parsed_events[i].timestamp else None
            }
            for i, event_id in enumerate(event_ids)
        ]
        
        # Add to index
        vector_store.add(embeddings, metadata)
        
        # Save updated index
        vector_store.save()
        logger.info(f"Updated Faiss index with {len(embeddings)} new vectors")
    except Exception:
        logger.exception("Failed to update Faiss index")

    logger.info(
        "Completed embeddings-based detection for upload %s (events=%d, anomalies=%d)",
        upload_id, len(batch_events), len(batch_anomalies)
    )
