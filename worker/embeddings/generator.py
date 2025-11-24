"""
Embeddings generator using Ollama
"""
import logging
import httpx
import numpy as np
from typing import List, Optional
from shared.schemas import ParsedEvent
from worker.config import (
    OLLAMA_BASE_URL,
    EMBEDDINGS_MODEL,
    EMBEDDINGS_DIM,
    EMBEDDING_TIMEOUT
)

logger = logging.getLogger("worker.embeddings")


def prepare_log_text(event: ParsedEvent) -> str:
    """
    Convert parsed event to text representation for embedding.
    
    Format: "timestamp | src_ip | method url status | user_agent"
    Example: "2024-01-15 10:30:45 | 192.168.1.1 | GET /api/users 200 | Mozilla/5.0..."
    """
    parts = []
    
    # Timestamp
    if event.timestamp:
        parts.append(str(event.timestamp))
    
    # Source IP
    if event.src_ip:
        parts.append(f"IP:{event.src_ip}")
    
    # HTTP request
    method = event.method or "UNKNOWN"
    url = event.url or "/"
    status = event.status or 0
    parts.append(f"{method} {url} {status}")
    
    # User agent (truncated to avoid too long text)
    if event.user_agent:
        ua = event.user_agent[:100]  # Limit length
        parts.append(f"UA:{ua}")
    
    # Username if present
    if event.username:
        parts.append(f"User:{event.username}")
    
    return " | ".join(parts)


async def generate_embedding(text: str, client: Optional[httpx.AsyncClient] = None) -> np.ndarray:
    """
    Generate embedding for a single text using Ollama.
    
    Args:
        text: Text to embed
        client: Optional httpx client (for connection pooling)
        
    Returns:
        Embedding vector as numpy array (768-dim)
    """
    should_close = False
    if client is None:
        client = httpx.AsyncClient(timeout=EMBEDDING_TIMEOUT)
        should_close = True
    
    try:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={
                "model": EMBEDDINGS_MODEL,
                "prompt": text
            }
        )
        response.raise_for_status()
        
        data = response.json()
        embedding = np.array(data["embedding"], dtype=np.float32)
        
        # Validate dimension
        if len(embedding) != EMBEDDINGS_DIM:
            logger.warning(
                f"Unexpected embedding dimension: {len(embedding)}, expected {EMBEDDINGS_DIM}"
            )
            return np.zeros(EMBEDDINGS_DIM, dtype=np.float32)
        
        return embedding
        
    except Exception as e:
        logger.exception(f"Failed to generate embedding: {e}")
        # Return zero vector on failure
        return np.zeros(EMBEDDINGS_DIM, dtype=np.float32)
    
    finally:
        if should_close:
            await client.aclose()


async def generate_embeddings_batch(
    texts: List[str],
    batch_size: int = 10
) -> List[np.ndarray]:
    """
    Generate embeddings for multiple texts in parallel.
    
    Args:
        texts: List of texts to embed
        batch_size: Number of concurrent requests
        
    Returns:
        List of embedding vectors
    """
    embeddings = []
    
    # Use shared client for connection pooling
    async with httpx.AsyncClient(timeout=EMBEDDING_TIMEOUT) as client:
        # Process in batches to avoid overwhelming Ollama
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # Generate embeddings concurrently for this batch
            import asyncio
            batch_embeddings = await asyncio.gather(
                *[generate_embedding(text, client) for text in batch],
                return_exceptions=True
            )
            
            # Handle exceptions
            for j, emb in enumerate(batch_embeddings):
                if isinstance(emb, Exception):
                    logger.error(f"Embedding generation failed for text {i+j}: {emb}")
                    embeddings.append(np.zeros(EMBEDDINGS_DIM, dtype=np.float32))
                else:
                    embeddings.append(emb)
    
    return embeddings


def is_zero_vector(embedding: np.ndarray) -> bool:
    """Check if embedding is a zero vector (failed generation)."""
    return np.allclose(embedding, 0.0)
