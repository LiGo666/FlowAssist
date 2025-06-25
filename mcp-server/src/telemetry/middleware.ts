import { Request, Response, NextFunction } from 'express';
import { context, trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Telemetry middleware for Express
 * Creates a trace for each request and tracks important metrics
 */
export function telemetryMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tracer = trace.getTracer('mcp-server');
    
    // Extract user ID and session ID from request
    const userId = (req.headers['x-user-id'] as string) || 'anonymous';
    const sessionId = (req.headers['x-session-id'] as string) || uuidv4();
    
    // Create a root span for the request
    const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.path': req.path,
        'http.host': req.headers.host,
        'user.id': userId,
        'session.id': sessionId,
        'request.id': uuidv4(),
        'request.text': req.body?.prompt || req.body?.text || '',
      },
    });
    
    // Store request start time for latency calculation
    const startTime = Date.now();
    
    // Create a context with the current span
    const requestContext = trace.setSpan(context.active(), span);
    
    // Execute the request within the context
    context.with(requestContext, () => {
      // Capture response data
      const originalSend = res.send;
      res.send = function(body) {
        // Record response data in the span
        const responseText = typeof body === 'string' ? body : JSON.stringify(body);
        span.setAttribute('response.text', responseText.substring(0, 1000)); // Truncate long responses
        
        // Calculate and record latency
        const latencyMs = Date.now() - startTime;
        span.setAttribute('latency.ms', latencyMs);
        
        // Extract token usage if available
        if (req.body?.usage) {
          span.setAttribute('tokens.total', req.body.usage.total_tokens || 0);
          span.setAttribute('tokens.prompt', req.body.usage.prompt_tokens || 0);
          span.setAttribute('tokens.completion', req.body.usage.completion_tokens || 0);
        }
        
        // Extract model name if available
        if (req.body?.model) {
          span.setAttribute('model.name', req.body.model);
        }
        
        // Set span status based on response status code
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP Error ${res.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        
        // End the span
        span.end();
        
        // Call the original send function
        return originalSend.call(this, body);
      };
      
      // Handle errors
      const handleError = (error: Error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.recordException(error);
        span.end();
      };
      
      // Add error handler
      res.on('error', handleError);
      
      // Continue with the request
      next();
    });
  };
}

/**
 * Create a child span for tool execution
 */
export function createToolSpan(
  toolName: string, 
  toolInput: any, 
  parentSpanName = 'HTTP POST /ask'
) {
  const tracer = trace.getTracer('mcp-server');
  
  // Get the current span (should be the request span)
  const parentSpan = trace.getSpan(context.active());
  
  if (!parentSpan) {
    console.warn(`No parent span found for tool ${toolName}`);
    return null;
  }
  
  // Create a child span for the tool
  const toolSpan = tracer.startSpan(`Tool ${toolName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'tool.name': toolName,
      'tool.input': toolInput,
    },
  });
  
  return toolSpan;
}

/**
 * End a tool span with the result
 */
export function endToolSpan(span: any, result: any, error?: Error) {
  if (!span) return;
  
  if (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    span.recordException(error);
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('tool.output', result);
  }
  
  span.end();
}

/**
 * Record context sources used in a request
 */
export function recordContextSources(sources: any[]) {
  const span = trace.getSpan(context.active());
  
  if (!span) {
    console.warn('No active span found for recording context sources');
    return;
  }
  
  span.setAttribute('context.sources', sources);
}
