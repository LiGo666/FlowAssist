import { createClient } from 'redis';
import { QdrantClient } from '@qdrant/js-client-rest';

interface ContextSource {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: number;
    type: string;
    [key: string]: any;
  };
  similarity?: number;
}

interface RankingOptions {
  recencyWeight: number;
  similarityWeight: number;
  maxResults: number;
  recencyWindowHours: number;
}

/**
 * Context ranking function that combines recency and similarity scores
 * to provide the most relevant context for a given query
 */
export class ContextRanker {
  private redisClient: ReturnType<typeof createClient>;
  private qdrantClient: QdrantClient;
  private defaultOptions: RankingOptions = {
    recencyWeight: 0.3,
    similarityWeight: 0.7,
    maxResults: 5,
    recencyWindowHours: 24
  };

  constructor() {
    // Initialize Redis client for short-term memory
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379'
    });
    
    this.redisClient.connect().catch(err => {
      console.error('Redis connection error:', err);
    });

    // Initialize Qdrant client for vector search
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://qdrant:6333'
    });
  }

  /**
   * Rank context sources by combining recency and similarity scores
   * 
   * @param query The user query to find similar context for
   * @param userId The user ID to filter context by
   * @param options Optional ranking parameters
   * @returns Ranked list of context sources
   */
  async rankContextSources(
    query: string, 
    userId: string, 
    options: Partial<RankingOptions> = {}
  ): Promise<ContextSource[]> {
    // Merge default options with provided options
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get recent context from Redis (short-term memory)
      const recentContextKeys = await this.redisClient.keys(`context:${userId}:*`);
      const recentContextPromises = recentContextKeys.map(key => this.redisClient.get(key));
      const recentContextValues = await Promise.all(recentContextPromises);
      
      // Parse recent context
      const recentContext: ContextSource[] = recentContextValues
        .filter(Boolean)
        .map(value => JSON.parse(value as string));
      
      // Get similar context from Qdrant (vector search)
      const vectorSearchResults = await this.qdrantClient.search('context', {
        vector: await this.getEmbedding(query),
        limit: opts.maxResults * 2, // Get more results than needed to allow for filtering
        filter: {
          must: [
            {
              key: 'metadata.userId',
              match: { value: userId }
            }
          ]
        }
      });
      
      // Convert Qdrant results to ContextSource format
      const similarContext: ContextSource[] = vectorSearchResults.map(result => ({
        id: result.id as string,
        content: result.payload?.content as string,
        metadata: result.payload?.metadata as any,
        similarity: result.score
      }));
      
      // Combine recent and similar context
      const allContext = [...recentContext, ...similarContext];
      
      // Remove duplicates by ID
      const uniqueContext = Array.from(
        new Map(allContext.map(item => [item.id, item])).values()
      );
      
      // Calculate recency score (0-1, higher is more recent)
      const now = Date.now();
      const recencyWindow = opts.recencyWindowHours * 60 * 60 * 1000;
      
      uniqueContext.forEach(item => {
        const age = now - (item.metadata.timestamp || 0);
        const recencyScore = Math.max(0, 1 - age / recencyWindow);
        const similarityScore = item.similarity || 0;
        
        // Combined score = recencyWeight * recencyScore + similarityWeight * similarityScore
        item.metadata.combinedScore = 
          opts.recencyWeight * recencyScore + 
          opts.similarityWeight * similarityScore;
      });
      
      // Sort by combined score (descending)
      uniqueContext.sort((a, b) => 
        (b.metadata.combinedScore || 0) - (a.metadata.combinedScore || 0)
      );
      
      // Return top results
      return uniqueContext.slice(0, opts.maxResults);
    } catch (error) {
      console.error('Error ranking context sources:', error);
      return [];
    }
  }

  /**
   * Store a context item in short-term memory (Redis)
   * 
   * @param context The context to store
   * @param ttlSeconds Time to live in seconds
   */
  async storeContext(context: ContextSource, ttlSeconds: number = 3600): Promise<void> {
    try {
      const key = `context:${context.metadata.userId}:${context.id}`;
      await this.redisClient.set(key, JSON.stringify(context), { EX: ttlSeconds });
    } catch (error) {
      console.error('Error storing context in Redis:', error);
    }
  }

  /**
   * Get embedding for a text using Ollama API
   * 
   * @param text The text to get embedding for
   * @returns Vector embedding
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('http://ollama:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: text
        })
      });
      
      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Error getting embedding from Ollama:', error);
      // Return empty vector as fallback
      return new Array(384).fill(0);
    }
  }

  /**
   * Clean up connections on shutdown
   */
  async shutdown(): Promise<void> {
    await this.redisClient.disconnect();
  }
}
