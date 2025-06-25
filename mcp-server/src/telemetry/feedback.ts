import { Request, Response } from 'express';
import { Pool } from 'pg';
import { Kafka, Producer } from 'kafkajs';

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'nextjs_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Kafka producer setup
const kafka = new Kafka({
  clientId: 'mcp-feedback',
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || 'redpanda:9092').split(','),
});
const producer = kafka.producer();
let connected = false;

// Connect to Kafka
async function connectToKafka() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log('Feedback service connected to Kafka');
  }
}

// Initialize connection
connectToKafka().catch(err => {
  console.error('Failed to connect to Kafka for feedback:', err);
});

/**
 * Handle feedback submission
 * Stores feedback in PostgreSQL and sends to Kafka topic
 */
export async function handleFeedback(req: Request, res: Response) {
  const { traceId, rating, comment, userId } = req.body;

  // Validate required fields
  if (!traceId || !rating) {
    return res.status(400).json({ error: 'Missing required fields: traceId and rating' });
  }

  // Validate rating value
  if (!['positive', 'negative', 'neutral'].includes(rating)) {
    return res.status(400).json({ error: 'Rating must be one of: positive, negative, neutral' });
  }

  try {
    // Store feedback in PostgreSQL
    const result = await pool.query(
      `INSERT INTO telemetry.feedback (trace_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING feedback_id`,
      [traceId, userId || 'anonymous', rating, comment || null]
    );

    const feedbackId = result.rows[0].feedback_id;

    // Send feedback event to Kafka
    if (connected) {
      await producer.send({
        topic: process.env.FEEDBACK_TOPIC || 'feedback',
        messages: [
          {
            key: traceId,
            value: JSON.stringify({
              feedbackId,
              traceId,
              userId: userId || 'anonymous',
              rating,
              comment: comment || null,
              timestamp: new Date().toISOString()
            })
          }
        ]
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      feedbackId
    });
  } catch (error) {
    console.error('Error handling feedback:', error);
    return res.status(500).json({ error: 'Failed to process feedback' });
  }
}

/**
 * Get feedback statistics for a user or all users
 */
export async function getFeedbackStats(req: Request, res: Response) {
  const userId = req.query.userId as string;

  try {
    let query = `
      SELECT 
        rating, 
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (created_at - t.start_time)) * 1000) as avg_response_time_ms
      FROM 
        telemetry.feedback f
      JOIN
        telemetry.traces t ON f.trace_id = t.trace_id
    `;

    const queryParams: any[] = [];
    
    if (userId) {
      query += ' WHERE f.user_id = $1';
      queryParams.push(userId);
    }
    
    query += ' GROUP BY rating';

    const result = await pool.query(query, queryParams);

    // Calculate NPS (Net Promoter Score)
    const stats = result.rows;
    const total = stats.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    const positiveCount = stats.find(row => row.rating === 'positive')?.count || 0;
    const negativeCount = stats.find(row => row.rating === 'negative')?.count || 0;
    
    const nps = total > 0 ? ((positiveCount - negativeCount) / total) * 100 : 0;

    return res.status(200).json({
      stats,
      nps: Math.round(nps * 10) / 10, // Round to 1 decimal place
      total
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve feedback statistics' });
  }
}

/**
 * Shutdown the feedback service
 */
export async function shutdown() {
  if (connected) {
    await producer.disconnect();
    connected = false;
  }
  await pool.end();
}
