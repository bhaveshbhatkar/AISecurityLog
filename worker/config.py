"""
Configuration for embeddings-based anomaly detection
"""
import os

# Ollama embeddings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
EMBEDDINGS_MODEL = "nomic-embed-text"  # 768-dimensional, fast, good quality
EMBEDDINGS_DIM = 768

# Faiss vector store
MODEL_BASE_DIR = os.getenv("MODEL_DIR", "/data/models")
FAISS_INDEX_PATH = os.path.join(MODEL_BASE_DIR, "faiss_index.bin")
FAISS_METADATA_PATH = os.path.join(MODEL_BASE_DIR, "faiss_metadata.pkl")

# Anomaly detection thresholds
DISTANCE_THRESHOLD = 0.75  # Cosine distance threshold for anomalies
MIN_NEIGHBORS_FOR_COMPARISON = 5  # Minimum neighbors needed for comparison
ANOMALY_SCORE_THRESHOLD = 0.7  # Final score threshold

# Processing
EMBEDDING_BATCH_SIZE = 50  # Process embeddings in batches
EMBEDDING_TIMEOUT = 30  # Timeout for embedding generation (seconds)

# Hybrid detection
ML_SCALE = 0.9  # Weight of embeddings score in hybrid detection
RULE_SCALE = 1.0  # Weight of rule-based score

# Logging
LOG_EMBEDDINGS_PROGRESS = True
