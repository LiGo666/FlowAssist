/**
 * Tool registry interface for tool metadata
 */
export interface ToolRegistryEntry {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    requiresAuth: boolean;
    rateLimitPerMinute: number;
    rateLimitPerDay: number;
    allowedRoles: string[];
}
/**
 * Tool registry service for managing tool permissions and rate limits
 */
export declare class ToolRegistry {
    private pool;
    private toolCache;
    private usageCounters;
    private lastCacheRefresh;
    private cacheValidityMs;
    constructor();
    /**
     * Refresh the tool registry cache from the database
     */
    private refreshCache;
    /**
     * Get a tool from the registry by name
     */
    getTool(toolName: string): Promise<ToolRegistryEntry | null>;
    /**
     * Check if a user is allowed to use a tool
     */
    canUseToolWithReason(toolName: string, userId: string, userRoles?: string[]): Promise<{
        allowed: boolean;
        reason: string;
    }>;
    /**
     * Check if a user is allowed to use a tool (simplified version)
     */
    canUseTool(toolName: string, userId: string, userRoles?: string[]): Promise<boolean>;
    /**
     * Get a user's tool preference
     */
    private getUserToolPreference;
    /**
     * Check rate limit for a user and tool
     */
    private checkRateLimit;
    /**
     * Record tool usage for rate limiting
     */
    recordToolUsage(userId: string, toolName: string): Promise<void>;
    /**
     * Clean up expired usage counters
     */
    private cleanupUsageCounters;
    /**
     * Register a new tool in the registry
     */
    registerTool(tool: Omit<ToolRegistryEntry, 'id'>): Promise<string>;
    /**
     * Update an existing tool in the registry
     */
    updateTool(toolId: string, updates: Partial<Omit<ToolRegistryEntry, 'id'>>): Promise<boolean>;
    /**
     * Clean up resources
     */
    shutdown(): Promise<void>;
}
export declare const toolRegistry: ToolRegistry;
