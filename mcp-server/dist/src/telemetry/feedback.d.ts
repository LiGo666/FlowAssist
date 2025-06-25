import { Request, Response } from 'express';
/**
 * Handle feedback submission
 * Stores feedback in PostgreSQL and sends to Kafka topic
 */
export declare function handleFeedback(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get feedback statistics for a user or all users
 */
export declare function getFeedbackStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Shutdown the feedback service
 */
export declare function shutdown(): Promise<void>;
