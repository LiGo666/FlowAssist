import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
/**
 * Redis-based short-term memory store for FlowAssist
 * Provides fast access to recent user interactions and context
 */
export class RedisMemory {
    constructor() {
        this.connected = false;
        this.keyPrefix = 'flowassist:memory:';
        this.defaultTTL = 24 * 60 * 60; // 24 hours in seconds
        // Initialize Redis client
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://redis:6379',
        });
        // Set up event handlers
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
        this.client.on('connect', () => {
            console.log('Connected to Redis');
            this.connected = true;
        });
        this.client.on('end', () => {
            console.log('Disconnected from Redis');
            this.connected = false;
        });
        // Connect to Redis
        this.connect();
    }
    /**
     * Connect to Redis server
     */
    async connect() {
        if (!this.connected) {
            try {
                await this.client.connect();
            }
            catch (error) {
                console.error('Failed to connect to Redis:', error);
                throw error;
            }
        }
    }
    /**
     * Ensure Redis connection is established
     */
    async ensureConnection() {
        if (!this.connected) {
            await this.connect();
        }
    }
    /**
     * Store a memory item in Redis
     *
     * @param item Memory item to store
     * @param ttl Time-to-live in seconds (optional)
     * @returns The ID of the stored item
     */
    async storeMemory(item, ttl) {
        await this.ensureConnection();
        const id = uuidv4();
        const memoryItem = {
            ...item,
            id,
        };
        // Create user-specific index key
        const userIndexKey = `${this.keyPrefix}user:${item.userId}:items`;
        // Create item key
        const itemKey = `${this.keyPrefix}item:${id}`;
        try {
            // Store the memory item
            await this.client.set(itemKey, JSON.stringify(memoryItem), { EX: ttl || this.defaultTTL });
            // Add to user's sorted set with timestamp as score for time-based retrieval
            await this.client.zAdd(userIndexKey, {
                score: item.timestamp,
                value: id
            });
            // Set TTL on the user index as well
            await this.client.expire(userIndexKey, ttl || this.defaultTTL);
            return id;
        }
        catch (error) {
            console.error('Failed to store memory in Redis:', error);
            throw error;
        }
    }
    /**
     * Retrieve a specific memory item by ID
     *
     * @param id ID of the memory item to retrieve
     * @returns The memory item or null if not found
     */
    async getMemory(id) {
        await this.ensureConnection();
        try {
            const itemKey = `${this.keyPrefix}item:${id}`;
            const data = await this.client.get(itemKey);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`Failed to retrieve memory ${id} from Redis:`, error);
            return null;
        }
    }
    /**
     * Get recent memories for a user
     *
     * @param userId User ID to get memories for
     * @param limit Maximum number of memories to retrieve
     * @param types Optional filter by memory types
     * @returns Array of memory items
     */
    async getRecentMemories(userId, limit = 10, types) {
        await this.ensureConnection();
        try {
            const userIndexKey = `${this.keyPrefix}user:${userId}:items`;
            // Get the most recent item IDs from the sorted set
            const itemIds = await this.client.zRange(userIndexKey, 0, limit - 1, {
                REV: true // Reverse order to get most recent first
            });
            if (!itemIds || itemIds.length === 0) {
                return [];
            }
            // Retrieve each item
            const itemPromises = itemIds.map(id => this.getMemory(id));
            const items = await Promise.all(itemPromises);
            // Filter out null results and by type if specified
            return items
                .filter((item) => item !== null &&
                (!types || types.includes(item.type)))
                .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
        }
        catch (error) {
            console.error(`Failed to retrieve recent memories for user ${userId}:`, error);
            return [];
        }
    }
    /**
     * Search for memories containing specific content
     *
     * @param userId User ID to search memories for
     * @param searchText Text to search for
     * @param limit Maximum number of results
     * @returns Array of matching memory items
     */
    async searchMemories(userId, searchText, limit = 10) {
        // Get all recent memories first
        const allMemories = await this.getRecentMemories(userId, 100);
        // Filter by content match
        const matchingMemories = allMemories.filter(memory => memory.content.toLowerCase().includes(searchText.toLowerCase()));
        // Return limited results
        return matchingMemories.slice(0, limit);
    }
    /**
     * Delete a specific memory item
     *
     * @param id ID of the memory to delete
     * @param userId User ID (for validation)
     * @returns True if deleted, false otherwise
     */
    async deleteMemory(id, userId) {
        await this.ensureConnection();
        try {
            // Get the memory first to verify ownership
            const memory = await this.getMemory(id);
            if (!memory || memory.userId !== userId) {
                return false;
            }
            const itemKey = `${this.keyPrefix}item:${id}`;
            const userIndexKey = `${this.keyPrefix}user:${userId}:items`;
            // Remove from user's sorted set
            await this.client.zRem(userIndexKey, id);
            // Delete the item
            await this.client.del(itemKey);
            return true;
        }
        catch (error) {
            console.error(`Failed to delete memory ${id}:`, error);
            return false;
        }
    }
    /**
     * Clear all memories for a user
     *
     * @param userId User ID to clear memories for
     * @returns Number of memories cleared
     */
    async clearUserMemories(userId) {
        await this.ensureConnection();
        try {
            const userIndexKey = `${this.keyPrefix}user:${userId}:items`;
            // Get all item IDs for the user
            const itemIds = await this.client.zRange(userIndexKey, 0, -1);
            if (!itemIds || itemIds.length === 0) {
                return 0;
            }
            // Delete each item
            const deletePromises = itemIds.map(id => this.client.del(`${this.keyPrefix}item:${id}`));
            await Promise.all(deletePromises);
            // Delete the user index
            await this.client.del(userIndexKey);
            return itemIds.length;
        }
        catch (error) {
            console.error(`Failed to clear memories for user ${userId}:`, error);
            return 0;
        }
    }
    /**
     * Store a conversation message in memory
     *
     * @param userId User ID
     * @param content Message content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    async storeMessage(userId, content, metadata) {
        return this.storeMemory({
            userId,
            content,
            type: 'message',
            timestamp: Date.now(),
            metadata
        });
    }
    /**
     * Store context information in memory
     *
     * @param userId User ID
     * @param content Context content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    async storeContext(userId, content, metadata) {
        return this.storeMemory({
            userId,
            content,
            type: 'context',
            timestamp: Date.now(),
            metadata
        });
    }
    /**
     * Store tool result in memory
     *
     * @param userId User ID
     * @param content Tool result content
     * @param metadata Additional metadata
     * @returns Memory item ID
     */
    async storeToolResult(userId, content, metadata) {
        return this.storeMemory({
            userId,
            content,
            type: 'tool_result',
            timestamp: Date.now(),
            metadata
        });
    }
    /**
     * Clean up resources
     */
    async shutdown() {
        if (this.connected) {
            await this.client.quit();
            this.connected = false;
        }
    }
}
// Export singleton instance
export const redisMemory = new RedisMemory();
