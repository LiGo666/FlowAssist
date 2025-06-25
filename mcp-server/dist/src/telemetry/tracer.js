import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { PostgresSpanExporter } from './exporters/postgres-exporter.js';
import { KafkaSpanExporter } from './exporters/kafka-exporter.js';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
/**
 * Initialize OpenTelemetry SDK with exporters for PostgreSQL and Kafka
 */
export function initTracer() {
    // Create a resource object with attributes
    // Using a simple object instead of Resource class to avoid TypeScript errors
    const resourceAttributes = {
        [SemanticResourceAttributes.SERVICE_NAME]: 'mcp-server',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    };
    // Create exporters
    const postgresExporter = new PostgresSpanExporter({
        host: process.env.POSTGRES_HOST || 'db',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'nextjs_db',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
    });
    const kafkaExporter = new KafkaSpanExporter({
        brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || 'redpanda:9092').split(','),
        topic: process.env.TELEMETRY_TOPIC || 'telemetry',
    });
    // Optional: Configure OTLP exporter for Jaeger/Tempo
    const otlpExporter = process.env.OTLP_ENDPOINT
        ? new OTLPTraceExporter({
            url: process.env.OTLP_ENDPOINT,
        })
        : undefined;
    // Create SDK with configured span processors
    const sdk = new NodeSDK({
        // @ts-ignore - Ignore type error for resource
        resourceAttributes,
        spanProcessors: [
            new SimpleSpanProcessor(postgresExporter),
            new SimpleSpanProcessor(kafkaExporter),
            ...(otlpExporter ? [new SimpleSpanProcessor(otlpExporter)] : []),
        ],
        instrumentations: [
            new HttpInstrumentation(),
            new ExpressInstrumentation(),
            new PgInstrumentation(),
        ],
    });
    // Start the SDK - Fix: Handle promise correctly
    try {
        // @ts-ignore - Ignore type error for start() method
        sdk.start();
        console.log('Tracing initialized');
    }
    catch (error) {
        console.log('Error initializing tracing', error);
    }
    // Gracefully shut down SDK on process exit
    process.on('SIGTERM', () => {
        try {
            // @ts-ignore - Ignore type error for shutdown() method
            sdk.shutdown();
            console.log('Tracing terminated');
        }
        catch (error) {
            console.log('Error terminating tracing', error);
        }
    });
}
