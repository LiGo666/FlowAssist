/**
 * Interface for memory items stored in Redis
 */
export interface MemoryItem {
    id: string;
    userId: string;
    content: string;
    type: 'message' | 'context' | 'tool_result' | 'system';
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * Redis-based short-term memory store for FlowAssist
 * Provides fast access to recent user interactions and context
 */
export declare class RedisMemory {
    private client;
    private connected;
    private readonly keyPrefix;
    private readonly defaultTTL;
    constructor();
    /**
     * Connect to Redis server
     */
    private connect;
    /**
     * Ensure Redis connection is established
     */
    private ensureConnection;
    /**
     * Store a memory item in Redis
     *
     * @param item Memory item to store
     * @param ttl Time-to-live in seconds (optional)
     * @returns The ID of the stored item
     */
    storeMemory(item: Omit<MemoryItem, 'id'>, ttl?: number): Promise<string>;
    /**
     * Retrieve a specific memory item by ID
     *
     * @param id ID of the memory item to retrieve
     * @returns The memory item or null if not found
     */
    getMemory(id: string): Promise<MemoryItem | null>;
    /**
     * Get recent memories for a user
     *
     * @param userId User ID to get memories for
     * @param limit Maximum number of memories to retrieve
     * @param types Optional filter by memory types
     * @returns Array of memory items
     */
    getRecentMemories(userId: string, limit?: number, types?: string[]): Promise<MemoryItem[]>;
    /**
     * Search for memories containing specific content
     *
     * @param userId User ID to search memories for
     * @param searchText Text to search for
     * @param limit Maximum number of results
     * @returns Array of matching memory items
     */
    searchMemories(userId: string, searchText: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Delete a specific memory item
     *
     * @param id ID of the memory to delete
     * @param userId User ID (for validation)
     * @returns True if deleted, false otherwise
     */
    deleteMemory(id: string, userId: string): Promise<boolean>;
    /**
     * Clear all memories for a user
     *
     * @param userId User ID to clear memories for
     * @returns Number of memories cleared
     */
    clearUserMemories(userId: string): Promise<number>;
    /**
     * Store a conversation message in memory
     *
     * @param userId User ID
     * @param content Message content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    storeMessage(userId: string, content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Store context information in memory
     *
     * @param userId User ID
     * @param content Context content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    storeContext(userId: string, content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Store tool result in memory
     *
     * @param userId User ID
     * @param content Tool result content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    storeToolResult(userId: string, content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Clean up resources
     */
    shutdown(): Promise<void>;
}
export declare const redisMemory: RedisMemory;
