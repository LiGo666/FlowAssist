# FlowAssist Architecture

## System Overview

FlowAssist is a comprehensive AI assistant platform that combines multiple services to provide a seamless experience for users. The architecture is designed to be modular, scalable, and observable, with a focus on telemetry and continuous improvement.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js        │     │  MCP Server     │     │  Ollama         │
│  Frontend       │◄────┤  (Node.js)      │◄────┤  LLM Service    │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  n8n            │     │  PostgreSQL     │     │  Redis          │
│  Workflow Engine│     │  Database       │     │  Cache          │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
         ┌─────────────┬─────────┴───────────┬─────────────┐
         │             │                     │             │
         ▼             ▼                     ▼             ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐ ┌─────────────────┐
│                 │ │             │ │                 │ │                 │
│  Redpanda       │ │ Analytics   │ │  Grafana        │ │  Qdrant         │
│  (Kafka)        │ │ Service     │ │  Dashboards     │ │  Vector DB      │
│                 │ │             │ │                 │ │                 │
└─────────────────┘ └─────────────┘ └─────────────────┘ └─────────────────┘
```

## Component Descriptions

### Frontend Layer
- **Next.js Frontend**: User interface for interacting with the AI assistant
  - Provides chat interface, tool toggles, and feedback collection
  - Communicates with MCP Server via REST and WebSocket APIs

### Core Services
- **MCP Server (Node.js)**: Central orchestration service
  - Handles user requests and routes them to appropriate services
  - Implements telemetry middleware for observability
  - Manages tool registry and security policies
  - Provides feedback and tool preference APIs

- **Ollama LLM Service**: Local large language model service
  - Provides AI capabilities including text generation and embeddings
  - Used for context ranking and semantic search

### Data Layer
- **PostgreSQL Database**: Primary data store
  - Stores telemetry data, tool usage, feedback, and user preferences
  - Implements schema with appropriate indexes for analytics

- **Redis Cache**: Short-term memory and caching
  - Stores recent context for fast retrieval
  - Handles session data and temporary storage

- **Qdrant Vector DB**: Vector database for semantic search
  - Stores embeddings for context retrieval
  - Enables similarity-based context ranking

### Analytics & Observability
- **Redpanda (Kafka)**: Event streaming platform
  - Streams telemetry and feedback events
  - Enables real-time analytics and processing

- **Analytics Service**: Data processing service
  - Consumes events from Redpanda
  - Generates insights and metrics
  - Updates materialized views in PostgreSQL

- **Grafana Dashboards**: Visualization platform
  - Displays metrics, latency, and feedback data
  - Provides operational insights and monitoring

### Automation
- **n8n Workflow Engine**: Workflow automation
  - Implements AI workflows and integrations
  - Provides no-code/low-code automation capabilities

## Data Flow

1. **User Request Flow**:
   - User sends a request via the Next.js frontend
   - Request is received by the MCP Server
   - Telemetry middleware creates a trace
   - MCP Server processes the request using appropriate tools
   - Response is sent back to the user
   - Telemetry data is stored in PostgreSQL and streamed to Redpanda

2. **Context Management Flow**:
   - User query is processed for context retrieval
   - Recent context is fetched from Redis
   - Similar context is retrieved from Qdrant
   - Context is ranked by recency and similarity
   - Most relevant context is included in the LLM request

3. **Feedback Flow**:
   - User provides feedback via the frontend
   - Feedback is sent to the MCP Server
   - Feedback is stored in PostgreSQL
   - Feedback events are streamed to Redpanda
   - Analytics service processes feedback for insights

4. **Tool Management Flow**:
   - User toggles tools via the ToolTogglePanel
   - Preferences are sent to the MCP Server
   - Preferences are stored in PostgreSQL
   - Tool registry enforces permissions and rate limits

## Security Architecture

- **Authentication**: User authentication via headers
- **Authorization**: Role-based access control for tools
- **Rate Limiting**: Per-user, per-tool rate limits
- **Tool Registry**: Central registry for tool governance
- **Secure Storage**: Encrypted credentials and sensitive data

## Observability Architecture

- **OpenTelemetry**: Distributed tracing for requests and tool calls
- **LangSmith**: LLM call observability and evaluation
- **Grafana**: Metrics visualization and dashboards
- **PostgreSQL**: Telemetry data storage and analysis
- **Redpanda**: Event streaming for real-time analytics
