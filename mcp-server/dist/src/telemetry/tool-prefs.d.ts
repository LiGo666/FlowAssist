import { Request, Response } from 'express';
/**
 * Get all available tools with their status for a user
 */
export declare function getUserTools(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update a user's tool preferences
 */
export declare function updateUserToolPrefs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Reset a user's tool preferences to default (remove all overrides)
 */
export declare function resetUserToolPrefs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Check if a tool is enabled for a user
 */
export declare function isToolEnabled(userId: string, toolName: string): Promise<boolean>;
