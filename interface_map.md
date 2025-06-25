# FlowAssist Interface Map

This document provides a comprehensive map of all interfaces in the FlowAssist platform, organized by user roles and components. Use this guide to navigate the various interfaces and understand how they interconnect.

## User Interfaces

### End Users

| Interface | URL | Description | Access Method |
|-----------|-----|-------------|---------------|
| **Chat UI** | http://localhost:3000 | Main conversational interface for interacting with the AI assistant | Web browser |
| **Tool Toggle Panel** | http://localhost:3000 (in Chat UI) | Control which AI tools and capabilities are enabled | Within Chat UI |
| **Feedback Mechanism** | http://localhost:3000 (in Chat UI) | Provide thumbs up/down and comments on AI responses | Within Chat UI |
| **TraceViewer** | http://localhost:3000/traceview | View detailed traces of AI interactions and tool calls | Web browser |

### Administrators

| Interface | URL | Description | Access Method |
|-----------|-----|-------------|---------------|
| **Grafana Dashboards** | http://localhost:3000/grafana | Monitor system metrics, usage patterns, and performance | Web browser |
| **n8n Workflow Editor** | http://localhost:5678 | Create and edit automation workflows | Web browser |
| **Analytics Reports** | http://localhost:8080 | View insights and reports from telemetry data | Web browser |
| **MCP Admin Panel** | http://localhost:3001/admin | Configure MCP server settings and tool registry | Web browser |

### Developers

| Interface | URL | Description | Access Method |
|-----------|-----|-------------|---------------|
| **MCP API** | http://localhost:3001 | Direct API access to the Model Context Protocol server | REST API |
| **Ollama API** | http://localhost:11434 | Access to the LLM service for model inference | REST API |
| **Qdrant API** | http://localhost:6333 | Vector database for semantic search and embeddings | REST API |
| **PostgreSQL** | postgresql://postgres:postgres@localhost:5432/nextjs_db | Direct database access for queries and administration | SQL client |
| **Redpanda Console** | http://localhost:9092 | Kafka-compatible event streaming platform | Kafka client |

## Service Interfaces

### Next.js Frontend

- **Port**: 3000
- **Primary Endpoints**:
  - `http://localhost:3000/` - Main chat interface
  - `http://localhost:3000/traceview` - Telemetry trace viewer

### MCP Server

- **Port**: 3001
- **Primary Endpoints**:
  - `http://localhost:3001/ask` - Main endpoint for AI requests
  - `http://localhost:3001/tools` - Tool registry and management
  - `http://localhost:3001/telemetry` - Telemetry data collection
  - `http://localhost:3001/admin` - Administrative interface

### Analytics Service

- **Port**: 8080
- **Primary Endpoints**:
  - `http://localhost:8080/metrics` - Service metrics and health
  - `http://localhost:8080/reports` - Generated insights and reports
  - `http://localhost:8080/pipelines` - Data processing pipeline status

### n8n Workflow Engine

- **Port**: 5678
- **Primary Interfaces**:
  - Web UI for workflow creation and management
  - REST API for programmatic workflow execution
  - Webhook endpoints for event-driven automation

## Integration Points

### Data Flow Interfaces

1. **User Request Flow**:
   ```
   User → Next.js Frontend → MCP Server → Ollama LLM → User
                                ↓
                         Telemetry & Feedback
                                ↓
                      Redpanda → Analytics Service
   ```

2. **Context Management Flow**:
   ```
   User Query → MCP Server → Redis (recent context)
                    ↓
             Qdrant (vector search)
                    ↓
             PostgreSQL (structured data)
   ```

3. **Feedback Loop**:
   ```
   User Feedback → Next.js → MCP Server → Redpanda
                                              ↓
                                      Analytics Service
                                              ↓
                                      Improvement Suggestions
                                              ↓
                                         MCP Server
   ```

## How to Use

### For End Users

1. **Chat Interface**:
   - Navigate to http://localhost:3000
   - Type your query in the chat box and press Enter
   - View AI responses in the conversation thread
   - Use the feedback buttons to rate responses

2. **Tool Toggle Panel**:
   - Click the "Tools" button in the chat interface
   - Toggle specific tools on/off based on your needs
   - Click "Apply" to update your preferences

3. **TraceViewer**:
   - Navigate to http://localhost:3000/traceview
   - Enter a trace ID to view detailed execution information
   - Expand tool calls to see inputs, outputs, and timing

### For Administrators

1. **Monitoring with Grafana**:
   - Access http://localhost:3000/grafana
   - Log in with admin credentials
   - View dashboards for system health, usage metrics, and performance

2. **Workflow Management with n8n**:
   - Access http://localhost:5678
   - Create, edit, and monitor automation workflows
   - Connect to external services and APIs

3. **Analytics Reports**:
   - Access http://localhost:8080
   - View usage patterns, common queries, and feedback metrics
   - Export reports for stakeholder presentations

### For Developers

1. **API Integration**:
   - Use the MCP API (http://localhost:3001) for direct AI interactions
   - Implement custom tools using the tool registry
   - Stream telemetry data for custom analytics

2. **Database Access**:
   - Connect to PostgreSQL (localhost:5432) for structured data
   - Use Qdrant (http://localhost:6333) for vector operations
   - Access Redpanda (localhost:9092) for event streaming

3. **Development Workflow**:
   - Modify Next.js components for UI changes
   - Update MCP Server for orchestration logic
   - Create new n8n workflows for automation
   - Monitor telemetry for performance optimization

## Troubleshooting

- **Interface Not Accessible**: Check Docker container status with `docker compose ps`
- **Slow Response Times**: Monitor Grafana dashboards for bottlenecks
- **Missing Data**: Verify Redpanda topics and consumers are functioning
- **Authentication Issues**: Check environment variables and credentials

## Security Notes

- All interfaces are currently accessible only on localhost
- Production deployments should implement proper authentication and TLS
- API keys and credentials should be managed securely through environment variables
- Role-based access control is recommended for multi-user environments