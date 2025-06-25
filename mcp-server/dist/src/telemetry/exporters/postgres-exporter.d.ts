import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult } from '@opentelemetry/core';
interface PostgresExporterConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    schema?: string;
}
/**
 * Custom span exporter that writes trace data to PostgreSQL
 */
export declare class PostgresSpanExporter implements SpanExporter {
    private pool;
    private schema;
    constructor(config: PostgresExporterConfig);
    /**
     * Export spans to PostgreSQL
     */
    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void;
    /**
     * Export a single span to PostgreSQL
     */
    private exportSpan;
    /**
     * Shutdown the exporter
     */
    shutdown(): Promise<void>;
}
export {};
