import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult } from '@opentelemetry/core';
interface KafkaExporterConfig {
    brokers: string[];
    topic: string;
    clientId?: string;
}
/**
 * Custom span exporter that writes trace data to Kafka/Redpanda
 */
export declare class KafkaSpanExporter implements SpanExporter {
    private producer;
    private topic;
    private connected;
    constructor(config: KafkaExporterConfig);
    /**
     * Connect to Kafka
     */
    private connect;
    /**
     * Export spans to Kafka
     */
    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void;
    /**
     * Send spans to Kafka
     */
    private sendSpans;
    /**
     * Shutdown the exporter
     */
    shutdown(): Promise<void>;
}
export {};
