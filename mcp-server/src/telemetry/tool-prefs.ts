import { Request, Response } from 'express';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'nextjs_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * Get all available tools with their status for a user
 */
export async function getUserTools(req: Request, res: Response) {
  const userId = req.params.userId || req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Get all tools from registry
    const toolsResult = await pool.query(
      `SELECT 
        tool_id, tool_name, description, is_enabled as global_enabled, 
        requires_auth, rate_limit_per_minute, rate_limit_per_day, allowed_roles
       FROM telemetry.tool_registry`
    );

    // Get user preferences for these tools
    const prefsResult = await pool.query(
      `SELECT tool_name, is_enabled
       FROM telemetry.user_tool_prefs
       WHERE user_id = $1`,
      [userId]
    );

    // Create a map of user preferences
    const userPrefs: Record<string, boolean> = {};
    prefsResult.rows.forEach(row => {
      userPrefs[row.tool_name] = row.is_enabled;
    });

    // Combine tool registry with user preferences
    const tools = toolsResult.rows.map(tool => ({
      id: tool.tool_id,
      name: tool.tool_name,
      description: tool.description,
      isEnabled: userPrefs.hasOwnProperty(tool.tool_name) 
        ? userPrefs[tool.tool_name] 
        : tool.global_enabled,
      requiresAuth: tool.requires_auth,
      rateLimit: {
        perMinute: tool.rate_limit_per_minute,
        perDay: tool.rate_limit_per_day
      },
      allowedRoles: tool.allowed_roles,
      userHasOverride: userPrefs.hasOwnProperty(tool.tool_name)
    }));

    return res.status(200).json({ tools });
  } catch (error) {
    console.error('Error getting user tools:', error);
    return res.status(500).json({ error: 'Failed to retrieve tool preferences' });
  }
}

/**
 * Update a user's tool preferences
 */
export async function updateUserToolPrefs(req: Request, res: Response) {
  const userId = req.params.userId;
  const { toolName, isEnabled } = req.body;

  if (!userId || !toolName || isEnabled === undefined) {
    return res.status(400).json({ 
      error: 'User ID, tool name, and enabled status are required' 
    });
  }

  try {
    // Check if tool exists in registry
    const toolExists = await pool.query(
      `SELECT 1 FROM telemetry.tool_registry WHERE tool_name = $1`,
      [toolName]
    );

    if (toolExists.rowCount === 0) {
      return res.status(404).json({ error: 'Tool not found in registry' });
    }

    // Upsert user preference
    await pool.query(
      `INSERT INTO telemetry.user_tool_prefs (user_id, tool_name, is_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tool_name) 
       DO UPDATE SET is_enabled = $3, updated_at = NOW()`,
      [userId, toolName, isEnabled]
    );

    return res.status(200).json({ 
      success: true, 
      message: `Tool ${toolName} ${isEnabled ? 'enabled' : 'disabled'} for user ${userId}`
    });
  } catch (error) {
    console.error('Error updating user tool preferences:', error);
    return res.status(500).json({ error: 'Failed to update tool preferences' });
  }
}

/**
 * Reset a user's tool preferences to default (remove all overrides)
 */
export async function resetUserToolPrefs(req: Request, res: Response) {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    await pool.query(
      `DELETE FROM telemetry.user_tool_prefs WHERE user_id = $1`,
      [userId]
    );

    return res.status(200).json({ 
      success: true, 
      message: `All tool preferences reset to default for user ${userId}`
    });
  } catch (error) {
    console.error('Error resetting user tool preferences:', error);
    return res.status(500).json({ error: 'Failed to reset tool preferences' });
  }
}

/**
 * Check if a tool is enabled for a user
 */
export async function isToolEnabled(userId: string, toolName: string): Promise<boolean> {
  try {
    // First check user preferences
    const userPrefResult = await pool.query(
      `SELECT is_enabled FROM telemetry.user_tool_prefs 
       WHERE user_id = $1 AND tool_name = $2`,
      [userId, toolName]
    );

    // If user has a preference, use that
    if (userPrefResult.rowCount > 0) {
      return userPrefResult.rows[0].is_enabled;
    }

    // Otherwise check global tool registry
    const toolResult = await pool.query(
      `SELECT is_enabled FROM telemetry.tool_registry WHERE tool_name = $1`,
      [toolName]
    );

    // If tool exists in registry, return its status
    if (toolResult.rowCount > 0) {
      return toolResult.rows[0].is_enabled;
    }

    // Default to disabled if tool doesn't exist
    return false;
  } catch (error) {
    console.error(`Error checking if tool ${toolName} is enabled for user ${userId}:`, error);
    // Default to disabled on error
    return false;
  }
}
