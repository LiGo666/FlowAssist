import { Request, Response, NextFunction } from 'express';
/**
 * Telemetry middleware for Express
 * Creates a trace for each request and tracks important metrics
 */
export declare function telemetryMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create a child span for tool execution
 */
export declare function createToolSpan(toolName: string, toolInput: any, parentSpanName?: string): import("@opentelemetry/api").Span;
/**
 * End a tool span with the result
 */
export declare function endToolSpan(span: any, result: any, error?: Error): void;
/**
 * Record context sources used in a request
 */
export declare function recordContextSources(sources: any[]): void;
