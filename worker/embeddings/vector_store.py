"""
Faiss vector store for similarity search
"""
import os
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from filelock import FileLock

try:
    import faiss
except ImportError:
    faiss = None
    logging.warning("Faiss not installed, embeddings-based detection will not work")

from worker.config import (
    FAISS_INDEX_PATH,
    FAISS_METADATA_PATH,
    EMBEDDINGS_DIM,
    MIN_NEIGHBORS_FOR_COMPARISON
)

logger = logging.getLogger("worker.vector_store")


class FaissVectorStore:
    """
    Manages Faiss index for vector similarity search.
    
    Uses IndexFlatL2 for exact L2 distance search.
    Stores metadata separately for event tracking.
    """
    
    def __init__(self, dim: int = EMBEDDINGS_DIM):
        """Initialize Faiss index."""
        self.dim = dim
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.n_vectors = 0
        
        if faiss is None:
            raise ImportError("Faiss is not installed")
        
        # Create new index
        self.index = faiss.IndexFlatL2(dim)
        logger.info(f"Created new Faiss index with dimension {dim}")
    
    def add(self, embeddings: np.ndarray, metadata: List[Dict]) -> None:
        """
        Add embeddings to the index.
        
        Args:
            embeddings: Array of shape (n, dim)
            metadata: List of metadata dicts for each embedding
        """
        if embeddings.shape[0] != len(metadata):
            raise ValueError("Number of embeddings must match metadata length")
        
        if embeddings.shape[1] != self.dim:
            raise ValueError(f"Embedding dimension {embeddings.shape[1]} doesn't match index dimension {self.dim}")
        
        # Ensure float32
        embeddings = embeddings.astype(np.float32)
        
        # Add to index
        self.index.add(embeddings)
        self.metadata.extend(metadata)
        self.n_vectors += len(embeddings)
        
        logger.info(f"Added {len(embeddings)} vectors to index (total: {self.n_vectors})")
    
    def search(
        self,
        query: np.ndarray,
        k: int = MIN_NEIGHBORS_FOR_COMPARISON
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Search for k nearest neighbors.
        
        Args:
            query: Query vector of shape (1, dim) or (dim,)
            k: Number of neighbors to return
            
        Returns:
            (distances, indices) - Both of shape (1, k)
        """
        if self.n_vectors == 0:
            # No vectors in index yet
            return np.array([[]], dtype=np.float32), np.array([[]], dtype=np.int64)
        
        # Ensure correct shape
        if query.ndim == 1:
            query = query.reshape(1, -1)
        
        # Ensure float32
        query = query.astype(np.float32)
        
        # Limit k to available vectors
        k = min(k, self.n_vectors)
        
        # Search
        distances, indices = self.index.search(query, k)
        
        return distances, indices
    
    def get_metadata(self, indices: List[int]) -> List[Dict]:
        """Get metadata for given indices."""
        return [self.metadata[i] for i in indices if 0 <= i < len(self.metadata)]
    
    def save(self, index_path: Optional[str] = None, metadata_path: Optional[str] = None) -> None:
        """
        Save index and metadata to disk.
        
        Args:
            index_path: Path to save index (default: FAISS_INDEX_PATH)
            metadata_path: Path to save metadata (default: FAISS_METADATA_PATH)
        """
        if index_path is None:
            index_path = FAISS_INDEX_PATH
        if metadata_path is None:
            metadata_path = FAISS_METADATA_PATH
        
        # Create directories
        Path(index_path).parent.mkdir(parents=True, exist_ok=True)
        Path(metadata_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Use file lock for thread safety
        lock_path = f"{index_path}.lock"
        
        try:
            with FileLock(lock_path, timeout=10):
                # Save Faiss index
                faiss.write_index(self.index, index_path)
                
                # Save metadata
                with open(metadata_path, 'wb') as f:
                    pickle.dump({
                        'metadata': self.metadata,
                        'n_vectors': self.n_vectors,
                        'dim': self.dim
                    }, f)
                
                logger.info(f"Saved Faiss index with {self.n_vectors} vectors to {index_path}")
        
        except Exception as e:
            logger.exception(f"Failed to save Faiss index: {e}")
            raise
    
    @classmethod
    def load(
        cls,
        index_path: Optional[str] = None,
        metadata_path: Optional[str] = None
    ) -> 'FaissVectorStore':
        """
        Load index and metadata from disk.
        
        Args:
            index_path: Path to load index from
            metadata_path: Path to load metadata from
            
        Returns:
            FaissVectorStore instance
        """
        if index_path is None:
            index_path = FAISS_INDEX_PATH
        if metadata_path is None:
            metadata_path = FAISS_METADATA_PATH
        
        store = cls()
        
        # Check if files exist
        if not os.path.exists(index_path) or not os.path.exists(metadata_path):
            logger.info("No existing Faiss index found, creating new one")
            return store
        
        # Use file lock for thread safety
        lock_path = f"{index_path}.lock"
        
        try:
            with FileLock(lock_path, timeout=10):
                # Load Faiss index
                store.index = faiss.read_index(index_path)
                
                # Load metadata
                with open(metadata_path, 'rb') as f:
                    data = pickle.load(f)
                    store.metadata = data['metadata']
                    store.n_vectors = data['n_vectors']
                    store.dim = data['dim']
                
                logger.info(
                    f"Loaded Faiss index with {store.n_vectors} vectors "
                    f"(dim={store.dim}) from {index_path}"
                )
        
        except Exception as e:
            logger.exception(f"Failed to load Faiss index: {e}")
            logger.info("Creating new index instead")
            store = cls()
        
        return store
    
    def get_stats(self) -> Dict:
        """Get index statistics."""
        return {
            'n_vectors': self.n_vectors,
            'dimension': self.dim,
            'index_type': 'IndexFlatL2',
            'metadata_count': len(self.metadata)
        }
