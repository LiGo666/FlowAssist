import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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
export class ToolRegistry {
  private pool: Pool;
  private toolCache: Map<string, ToolRegistryEntry> = new Map();
  private usageCounters: Map<string, { minute: Map<string, number>, day: Map<string, number> }> = new Map();
  private lastCacheRefresh: number = 0;
  private cacheValidityMs: number = 60000; // 1 minute

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'db',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'nextjs_db',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    });

    // Initialize usage counters and refresh cache
    this.refreshCache();
    
    // Set up periodic cleanup of usage counters
    setInterval(() => this.cleanupUsageCounters(), 60000); // Every minute
  }

  /**
   * Refresh the tool registry cache from the database
   */
  private async refreshCache(): Promise<void> {
    try {
      const result = await this.pool.query(`
        SELECT 
          tool_id, tool_name, description, is_enabled, 
          requires_auth, rate_limit_per_minute, rate_limit_per_day, allowed_roles
        FROM telemetry.tool_registry
      `);

      // Update cache
      this.toolCache.clear();
      result.rows.forEach((row: any) => {
        this.toolCache.set(row.tool_name, {
          id: row.tool_id,
          name: row.tool_name,
          description: row.description,
          isEnabled: row.is_enabled,
          requiresAuth: row.requires_auth,
          rateLimitPerMinute: row.rate_limit_per_minute,
          rateLimitPerDay: row.rate_limit_per_day,
          allowedRoles: row.allowed_roles
        });
      });

      this.lastCacheRefresh = Date.now();
    } catch (error) {
      console.error('Error refreshing tool registry cache:', error);
    }
  }

  /**
   * Get a tool from the registry by name
   */
  async getTool(toolName: string): Promise<ToolRegistryEntry | null> {
    // Refresh cache if needed
    if (Date.now() - this.lastCacheRefresh > this.cacheValidityMs) {
      await this.refreshCache();
    }

    return this.toolCache.get(toolName) || null;
  }

  /**
   * Check if a user is allowed to use a tool
   */
  async canUseToolWithReason(
    toolName: string, 
    userId: string, 
    userRoles: string[] = ['user']
  ): Promise<{ allowed: boolean; reason: string }> {
    // Get tool from registry
    const tool = await this.getTool(toolName);

    // Tool doesn't exist
    if (!tool) {
      return { allowed: false, reason: 'Tool not found in registry' };
    }

    // Tool is disabled globally
    if (!tool.isEnabled) {
      return { allowed: false, reason: 'Tool is disabled globally' };
    }

    // Check user tool preferences
    const userPref = await this.getUserToolPreference(userId, toolName);
    if (userPref !== null && !userPref) {
      return { allowed: false, reason: 'Tool is disabled by user preference' };
    }

    // Check role-based access
    const hasRole = userRoles.some(role => tool.allowedRoles.includes(role));
    if (!hasRole) {
      return { allowed: false, reason: 'User does not have required role' };
    }

    // Check rate limits
    const minuteLimit = await this.checkRateLimit(userId, toolName, 'minute');
    if (!minuteLimit.allowed) {
      return { allowed: false, reason: minuteLimit.reason };
    }

    const dayLimit = await this.checkRateLimit(userId, toolName, 'day');
    if (!dayLimit.allowed) {
      return { allowed: false, reason: dayLimit.reason };
    }

    return { allowed: true, reason: 'Access granted' };
  }

  /**
   * Check if a user is allowed to use a tool (simplified version)
   */
  async canUseTool(
    toolName: string, 
    userId: string, 
    userRoles: string[] = ['user']
  ): Promise<boolean> {
    const result = await this.canUseToolWithReason(toolName, userId, userRoles);
    return result.allowed;
  }

  /**
   * Get a user's tool preference
   */
  private async getUserToolPreference(userId: string, toolName: string): Promise<boolean | null> {
    try {
      const result = await this.pool.query(
        `SELECT is_enabled FROM telemetry.user_tool_prefs 
         WHERE user_id = $1 AND tool_name = $2`,
        [userId, toolName]
      );

      if (result.rowCount !== null && result.rowCount > 0) {
        return result.rows[0].is_enabled;
      }

      return null; // No preference set
    } catch (error) {
      console.error('Error getting user tool preference:', error);
      return null;
    }
  }

  /**
   * Check rate limit for a user and tool
   */
  private async checkRateLimit(
    userId: string, 
    toolName: string, 
    period: 'minute' | 'day'
  ): Promise<{ allowed: boolean; reason: string }> {
    // Get tool from registry
    const tool = await this.getTool(toolName);
    if (!tool) {
      return { allowed: false, reason: 'Tool not found' };
    }

    // Get limit based on period
    const limit = period === 'minute' ? tool.rateLimitPerMinute : tool.rateLimitPerDay;

    // Get current usage
    const userKey = `${userId}:${toolName}`;
    if (!this.usageCounters.has(userKey)) {
      this.usageCounters.set(userKey, {
        minute: new Map(),
        day: new Map()
      });
    }

    const counters = this.usageCounters.get(userKey)!;
    const periodMap = counters[period];
    
    // Get current time bucket
    const now = new Date();
    const bucket = period === 'minute' 
      ? `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
      : `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    // Get current count
    const count = periodMap.get(bucket) || 0;
    
    // Check if limit exceeded
    if (count >= limit) {
      return { 
        allowed: false, 
        reason: `Rate limit exceeded: ${count}/${limit} calls per ${period}` 
      };
    }
    
    return { allowed: true, reason: 'Within rate limit' };
  }

  /**
   * Record tool usage for rate limiting
   */
  async recordToolUsage(userId: string, toolName: string): Promise<void> {
    const userKey = `${userId}:${toolName}`;
    if (!this.usageCounters.has(userKey)) {
      this.usageCounters.set(userKey, {
        minute: new Map(),
        day: new Map()
      });
    }

    const counters = this.usageCounters.get(userKey)!;
    const now = new Date();
    
    // Update minute counter
    const minuteBucket = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const minuteCount = counters.minute.get(minuteBucket) || 0;
    counters.minute.set(minuteBucket, minuteCount + 1);
    
    // Update day counter
    const dayBucket = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const dayCount = counters.day.get(dayBucket) || 0;
    counters.day.set(dayBucket, dayCount + 1);
  }

  /**
   * Clean up expired usage counters
   */
  private cleanupUsageCounters(): void {
    const now = new Date();
    
    // Keep only the last 10 minutes and current day
    const currentMinuteBucket = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const currentDayBucket = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    // For each user-tool pair
    for (const [userKey, counters] of Array.from(this.usageCounters.entries())) {
      // Clean minute counters
      for (const bucket of counters.minute.keys()) {
        // Keep only current minute and previous 9 minutes
        const bucketParts = bucket.split('-');
        const bucketDate = new Date(
          parseInt(bucketParts[0]),
          parseInt(bucketParts[1]),
          parseInt(bucketParts[2]),
          parseInt(bucketParts[3]),
          parseInt(bucketParts[4])
        );
        
        // If bucket is older than 10 minutes, remove it
        if (now.getTime() - bucketDate.getTime() > 10 * 60 * 1000) {
          counters.minute.delete(bucket);
        }
      }
      
      // Clean day counters (keep only current day)
      for (const bucket of counters.day.keys()) {
        if (bucket !== currentDayBucket) {
          counters.day.delete(bucket);
        }
      }
    }
  }

  /**
   * Register a new tool in the registry
   */
  async registerTool(tool: Omit<ToolRegistryEntry, 'id'>): Promise<string> {
    const toolId = uuidv4();
    
    try {
      await this.pool.query(`
        INSERT INTO telemetry.tool_registry (
          tool_id, tool_name, description, is_enabled, 
          requires_auth, rate_limit_per_minute, rate_limit_per_day, allowed_roles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        toolId,
        tool.name,
        tool.description,
        tool.isEnabled,
        tool.requiresAuth,
        tool.rateLimitPerMinute,
        tool.rateLimitPerDay,
        JSON.stringify(tool.allowedRoles)
      ]);
      
      // Refresh cache
      await this.refreshCache();
      
      return toolId;
    } catch (error) {
      console.error('Error registering tool:', error);
      throw error;
    }
  }

  /**
   * Update an existing tool in the registry
   */
  async updateTool(toolId: string, updates: Partial<Omit<ToolRegistryEntry, 'id'>>): Promise<boolean> {
    try {
      // Build update query dynamically based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [toolId];
      let paramIndex = 2;
      
      if (updates.name !== undefined) {
        updateFields.push(`tool_name = $${paramIndex++}`);
        values.push(updates.name);
      }
      
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      
      if (updates.isEnabled !== undefined) {
        updateFields.push(`is_enabled = $${paramIndex++}`);
        values.push(updates.isEnabled);
      }
      
      if (updates.requiresAuth !== undefined) {
        updateFields.push(`requires_auth = $${paramIndex++}`);
        values.push(updates.requiresAuth);
      }
      
      if (updates.rateLimitPerMinute !== undefined) {
        updateFields.push(`rate_limit_per_minute = $${paramIndex++}`);
        values.push(updates.rateLimitPerMinute);
      }
      
      if (updates.rateLimitPerDay !== undefined) {
        updateFields.push(`rate_limit_per_day = $${paramIndex++}`);
        values.push(updates.rateLimitPerDay);
      }
      
      if (updates.allowedRoles !== undefined) {
        updateFields.push(`allowed_roles = $${paramIndex++}`);
        values.push(JSON.stringify(updates.allowedRoles));
      }
      
      // Add updated_at timestamp
      updateFields.push(`updated_at = NOW()`);
      
      // Execute update if there are fields to update
      if (updateFields.length > 0) {
        const result = await this.pool.query(`
          UPDATE telemetry.tool_registry
          SET ${updateFields.join(', ')}
          WHERE tool_id = $1
        `, values);
        
        // Refresh cache
        await this.refreshCache();
        
        return result.rowCount > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
