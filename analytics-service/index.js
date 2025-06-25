const express = require('express');
const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Configure PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'nextjs_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Configure Kafka connection
const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'redpanda:9092'],
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(port, () => {
  console.log(`Analytics service listening on port ${port}`);
  console.log('Environment variables:');
  console.log(`- POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'db'}`);
  console.log(`- KAFKA_BOOTSTRAP_SERVERS: ${process.env.KAFKA_BOOTSTRAP_SERVERS || 'redpanda:9092'}`);
  console.log(`- TELEMETRY_TOPIC: ${process.env.TELEMETRY_TOPIC || 'telemetry'}`);
  console.log(`- FEEDBACK_TOPIC: ${process.env.FEEDBACK_TOPIC || 'feedback'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end();
  process.exit(0);
});

console.log('Analytics service initialized');
