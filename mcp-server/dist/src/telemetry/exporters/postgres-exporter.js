import { ExportResultCode } from '@opentelemetry/core';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
/**
 * Custom span exporter that writes trace data to PostgreSQL
 */
export class PostgresSpanExporter {
    constructor(config) {
        this.schema = config.schema || 'telemetry';
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
        });
    }
    /**
     * Export spans to PostgreSQL
     */
    export(spans, resultCallback) {
        if (spans.length === 0) {
            resultCallback({ code: ExportResultCode.SUCCESS });
            return;
        }
        const promises = [];
        for (const span of spans) {
            const promise = this.exportSpan(span).catch(error => {
                console.error('Error exporting span to PostgreSQL:', error);
            });
            promises.push(promise);
        }
        Promise.all(promises)
            .then(() => {
            resultCallback({ code: ExportResultCode.SUCCESS });
        })
            .catch(error => {
            console.error('Error exporting spans to PostgreSQL:', error);
            resultCallback({ code: ExportResultCode.FAILED, error });
        });
    }
    /**
     * Export a single span to PostgreSQL
     */
    async exportSpan(span) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const traceId = span.spanContext().traceId;
            const spanId = span.spanContext().spanId;
            // Fix: parentSpanId property doesn't exist directly on ReadableSpan
            const parentSpanId = span.parentSpanId || '';
            const name = span.name;
            const kind = span.kind;
            const startTime = new Date(span.startTime[0] * 1000 + span.startTime[1] / 1000000);
            const endTime = new Date(span.endTime[0] * 1000 + span.endTime[1] / 1000000);
            const attributes = span.attributes;
            const status = span.status;
            const events = span.events;
            // Calculate duration in milliseconds
            const durationMs = (span.endTime[0] - span.startTime[0]) * 1000 +
                (span.endTime[1] - span.startTime[1]) / 1000000;
            // Extract user and session info from span attributes
            const userId = attributes['user.id'] || 'anonymous';
            const sessionId = attributes['session.id'] || uuidv4();
            // Handle root spans (requests) differently from child spans (tool calls)
            if (!parentSpanId) {
                // This is a root span (request)
                const requestText = attributes['request.text'] || '';
                const responseText = attributes['response.text'] || '';
                const modelName = attributes['model.name'] || '';
                const totalTokens = attributes['tokens.total'] || 0;
                const promptTokens = attributes['tokens.prompt'] || 0;
                const completionTokens = attributes['tokens.completion'] || 0;
                // Insert into traces table
                await client.query(`
          INSERT INTO ${this.schema}.traces (
            trace_id, user_id, session_id, request_text, response_text, 
            status, start_time, end_time, total_tokens, prompt_tokens, 
            completion_tokens, model_name, latency_ms, metadata
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, $9, $10, 
            $11, $12, $13, $14
          )
          ON CONFLICT (trace_id) 
          DO UPDATE SET
            response_text = EXCLUDED.response_text,
            status = EXCLUDED.status,
            end_time = EXCLUDED.end_time,
            total_tokens = EXCLUDED.total_tokens,
            prompt_tokens = EXCLUDED.prompt_tokens,
            completion_tokens = EXCLUDED.completion_tokens,
            latency_ms = EXCLUDED.latency_ms,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `, [
                    traceId,
                    userId,
                    sessionId,
                    requestText,
                    responseText,
                    status.code,
                    startTime,
                    endTime,
                    totalTokens,
                    promptTokens,
                    completionTokens,
                    modelName,
                    durationMs,
                    JSON.stringify(attributes)
                ]);
            }
            else {
                // This is a child span (tool call)
                const toolName = attributes['tool.name'] || name;
                const toolInput = attributes['tool.input'] || '';
                const toolOutput = attributes['tool.output'] || '';
                const toolStatus = attributes['tool.status'] || status.code.toString();
                // Insert into spans table
                await client.query(`
          INSERT INTO ${this.schema}.spans (
            trace_id, span_id, parent_span_id, name, kind,
            start_time, end_time, status, tool_name, tool_input,
            tool_output, tool_status, latency_ms, metadata
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14
          )
          ON CONFLICT (span_id) 
          DO UPDATE SET
            tool_output = EXCLUDED.tool_output,
            tool_status = EXCLUDED.tool_status,
            end_time = EXCLUDED.end_time,
            status = EXCLUDED.status,
            latency_ms = EXCLUDED.latency_ms,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `, [
                    traceId,
                    spanId,
                    parentSpanId,
                    name,
                    kind,
                    startTime,
                    endTime,
                    status.code,
                    toolName,
                    toolInput,
                    toolOutput,
                    toolStatus,
                    durationMs,
                    JSON.stringify(attributes)
                ]);
            }
            // Insert span events
            for (const event of events) {
                await client.query(`
          INSERT INTO ${this.schema}.span_events (
            span_id, name, timestamp, attributes
          ) VALUES (
            $1, $2, $3, $4
          )
          ON CONFLICT (span_id, name, timestamp) 
          DO UPDATE SET
            attributes = EXCLUDED.attributes,
            updated_at = NOW()
        `, [
                    spanId,
                    event.name,
                    new Date(event.time[0] * 1000 + event.time[1] / 1000000),
                    JSON.stringify(event.attributes)
                ]);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Shutdown the exporter
     */
    async shutdown() {
        await this.pool.end();
    }
}
