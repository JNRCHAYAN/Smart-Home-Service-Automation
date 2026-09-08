import env from '../config/env.js';
import { ai } from './aiClient.js';

const CHROMA_URL = env.chromaUrl;
const COLLECTION_NAME = 'servio_knowledge';

// RAG client for the ChromaDB vector store ('servio_knowledge'): collection
// lifecycle, document ingestion with embeddings, and semantic query/hybrid
// search. ChromaDB being unavailable is tolerated, not fatal — query calls
// degrade to empty results so the chat tools keep working without RAG.
class ChromaRAG {
  constructor() {
    this.baseUrl = CHROMA_URL;
    this.collectionName = COLLECTION_NAME;
  }

  async ensureCollection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.collectionName,
          metadata: { 'hnsw:space': 'cosine' }
        })
      });
      if (!response.ok && response.status !== 409) {
        const error = await response.text();
        console.warn('ChromaDB collection creation:', error);
      }
    } catch (e) {
      console.warn('ChromaDB not available, RAG disabled:', e.message);
    }
  }

  async addDocuments(documents) {
    await this.ensureCollection();

    const ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);
    const texts = documents.map((d) => d.content);
    const metadatas = documents.map((d) => d.metadata || {});

    const embeddings = [];
    for (const text of texts) {
      try {
        const embedding = await ai.createEmbedding(text);
        embeddings.push(embedding);
      } catch (e) {
        console.error('Embedding failed:', e.message);
        // Zero-vector fallback keeps the whole batch ingestible when one text
        // cannot be embedded (the vector simply matches nothing).
        embeddings.push(new Array(3072).fill(0));
      }
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, documents: texts, metadatas, embeddings })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ChromaDB add failed: ${error}`);
    }

    return { count: ids.length };
  }

  async query(queryText, nResults = 5, filter = {}) {
    try {
      const queryEmbedding = await ai.createEmbedding(queryText);

      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding],
          n_results: nResults,
          where: Object.keys(filter).length > 0 ? filter : undefined,
          include: ['documents', 'metadatas', 'distances']
        })
      });

      // Graceful degradation: an HTTP failure (e.g. ChromaDB down) returns empty
      // arrays shaped like a real response instead of rejecting the caller.
      if (!response.ok) {
        return { documents: [[]], metadatas: [[]], distances: [[]] };
      }

      return response.json();
    } catch (e) {
      console.error('ChromaDB query failed:', e.message);
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }
  }

  async hybridSearch(queryText, nResults = 5) {
    // Hybrid search currently runs the semantic (vector) query only; no lexical
    // leg is implemented yet, so callers treat this as pure vector retrieval.
    const semanticResults = await this.query(queryText, nResults);
    return semanticResults;
  }

  async deleteCollection() {
    await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}`, {
      method: 'DELETE'
    });
  }
}

export const chromaRag = new ChromaRAG();
