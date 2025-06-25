-- FlowAssist Database Schema
-- This script initializes the database schema for telemetry, tool usage, and feedback

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create schema for telemetry data
CREATE SCHEMA IF NOT EXISTS telemetry;

-- Create enum types
CREATE TYPE telemetry.trace_status AS ENUM ('started', 'in_progress', 'completed', 'failed');
CREATE TYPE telemetry.tool_status AS ENUM ('success', 'failure', 'timeout', 'rate_limited');
CREATE TYPE telemetry.feedback_rating AS ENUM ('positive', 'negative', 'neutral');

-- Traces table - stores overall request traces
CREATE TABLE IF NOT EXISTS telemetry.traces (
    trace_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    session_id UUID NOT NULL,
    request_text TEXT NOT NULL,
    response_text TEXT,
    status telemetry.trace_status NOT NULL DEFAULT 'started',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    total_tokens INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    model_name VARCHAR(100),
    latency_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool usage table - stores individual tool calls within traces
CREATE TABLE IF NOT EXISTS telemetry.tool_usage (
    tool_usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id UUID NOT NULL REFERENCES telemetry.traces(trace_id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_input JSONB NOT NULL,
    tool_output JSONB,
    status telemetry.tool_status NOT NULL DEFAULT 'success',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback table - stores user feedback on responses
CREATE TABLE IF NOT EXISTS telemetry.feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id UUID NOT NULL REFERENCES telemetry.traces(trace_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating telemetry.feedback_rating NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User tool preferences - stores which tools a user has enabled/disabled
CREATE TABLE IF NOT EXISTS telemetry.user_tool_prefs (
    pref_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, tool_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_traces_user_id ON telemetry.traces(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_session_id ON telemetry.traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_start_time ON telemetry.traces(start_time);
CREATE INDEX IF NOT EXISTS idx_tool_usage_trace_id ON telemetry.tool_usage(trace_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON telemetry.tool_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_feedback_trace_id ON telemetry.feedback(trace_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON telemetry.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tool_prefs_user_id ON telemetry.user_tool_prefs(user_id);

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry.daily_metrics AS
SELECT
    DATE_TRUNC('day', t.start_time) AS day,
    COUNT(DISTINCT t.trace_id) AS total_requests,
    COUNT(DISTINCT t.user_id) AS unique_users,
    AVG(t.latency_ms) AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY t.latency_ms) AS p95_latency_ms,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) AS success_rate,
    AVG(t.total_tokens) AS avg_tokens_per_request,
    COUNT(DISTINCT tu.tool_name) AS unique_tools_used,
    SUM(CASE WHEN f.rating = 'positive' THEN 1 ELSE 0 END)::FLOAT / 
        NULLIF(COUNT(DISTINCT f.feedback_id), 0) AS satisfaction_rate
FROM
    telemetry.traces t
LEFT JOIN
    telemetry.tool_usage tu ON t.trace_id = tu.trace_id
LEFT JOIN
    telemetry.feedback f ON t.trace_id = f.trace_id
GROUP BY
    DATE_TRUNC('day', t.start_time)
WITH NO DATA;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_day ON telemetry.daily_metrics(day);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION telemetry.refresh_daily_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW telemetry.daily_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create tool registry table for governance
CREATE TABLE IF NOT EXISTS telemetry.tool_registry (
    tool_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
    allowed_roles JSONB NOT NULL DEFAULT '["user", "admin"]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create context sources table for tracking where context comes from
CREATE TABLE IF NOT EXISTS telemetry.context_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id UUID NOT NULL REFERENCES telemetry.traces(trace_id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- e.g., 'document', 'conversation', 'tool_output'
    source_name VARCHAR(255) NOT NULL,
    content_snippet TEXT,
    relevance_score FLOAT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on context sources
CREATE INDEX IF NOT EXISTS idx_context_sources_trace_id ON telemetry.context_sources(trace_id);

-- Grant permissions to postgres user
GRANT ALL PRIVILEGES ON SCHEMA telemetry TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA telemetry TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA telemetry TO postgres;
