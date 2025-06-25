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
export declare class ContextRanker {
    private redisClient;
    private qdrantClient;
    private defaultOptions;
    constructor();
    /**
     * Rank context sources by combining recency and similarity scores
     *
     * @param query The user query to find similar context for
     * @param userId The user ID to filter context by
     * @param options Optional ranking parameters
     * @returns Ranked list of context sources
     */
    rankContextSources(query: string, userId: string, options?: Partial<RankingOptions>): Promise<ContextSource[]>;
    /**
     * Store a context item in short-term memory (Redis)
     *
     * @param context The context to store
     * @param ttlSeconds Time to live in seconds
     */
    storeContext(context: ContextSource, ttlSeconds?: number): Promise<void>;
    /**
     * Get embedding for a text using Ollama API
     *
     * @param text The text to get embedding for
     * @returns Vector embedding
     */
    private getEmbedding;
    /**
     * Clean up connections on shutdown
     */
    shutdown(): Promise<void>;
}
export {};
