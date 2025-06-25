import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { Kafka, Producer } from 'kafkajs';

interface KafkaExporterConfig {
  brokers: string[];
  topic: string;
  clientId?: string;
}

/**
 * Custom span exporter that writes trace data to Kafka/Redpanda
 */
export class KafkaSpanExporter implements SpanExporter {
  private producer: Producer;
  private topic: string;
  private connected: boolean = false;

  constructor(config: KafkaExporterConfig) {
    const kafka = new Kafka({
      clientId: config.clientId || 'mcp-telemetry',
      brokers: config.brokers,
    });

    this.producer = kafka.producer();
    this.topic = config.topic;
    
    // Connect to Kafka on initialization
    this.connect().catch(err => {
      console.error('Failed to connect to Kafka:', err);
    });
  }

  /**
   * Connect to Kafka
   */
  private async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log('Connected to Kafka');
    }
  }

  /**
   * Export spans to Kafka
   */
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    if (spans.length === 0) {
      resultCallback({ code: ExportResultCode.SUCCESS });
      return;
    }

    this.sendSpans(spans)
      .then(() => {
        resultCallback({ code: ExportResultCode.SUCCESS });
      })
      .catch(error => {
        console.error('Error exporting spans to Kafka:', error);
        resultCallback({ code: ExportResultCode.FAILED, error });
      });
  }

  /**
   * Send spans to Kafka
   */
  private async sendSpans(spans: ReadableSpan[]): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    const messages = spans.map(span => {
      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;
      // Fix: parentSpanId property doesn't exist directly on ReadableSpan
      const parentSpanId = (span as any).parentSpanId || '';
      const name = span.name;
      const kind = span.kind;
      const startTime = span.startTime;
      const endTime = span.endTime;
      const attributes = span.attributes;
      const status = span.status;
      const events = span.events;
      
      // Calculate duration in milliseconds
      const durationMs = (span.endTime[0] - span.startTime[0]) * 1000 + 
                        (span.endTime[1] - span.startTime[1]) / 1000000;

      // Create a structured message for Kafka
      const message = {
        traceId,
        spanId,
        parentSpanId: parentSpanId || null,
        name,
        kind,
        startTime: new Date(startTime[0] * 1000 + startTime[1] / 1000000).toISOString(),
        endTime: new Date(endTime[0] * 1000 + endTime[1] / 1000000).toISOString(),
        durationMs,
        attributes,
        status: {
          code: status.code,
          message: status.message || null
        },
        events: events.map(event => ({
          name: event.name,
          time: new Date(event.time[0] * 1000 + event.time[1] / 1000000).toISOString(),
          attributes: event.attributes
        }))
      };

      return {
        key: traceId,
        value: JSON.stringify(message),
        headers: {
          'span-type': parentSpanId ? Buffer.from('child') : Buffer.from('root'),
          'timestamp': Buffer.from(Date.now().toString())
        }
      };
    });

    await this.producer.send({
      topic: this.topic,
      messages
    });
  }

  /**
   * Shutdown the exporter
   */
  async shutdown(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('Disconnected from Kafka');
    }
  }
}
