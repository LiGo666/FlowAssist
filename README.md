# FlowAssist

A comprehensive AI-powered development environment with Next.js, Model Context Protocol (MCP) Server, analytics capabilities, n8n workflow automation, Ollama LLM server, Qdrant vector database, and PostgreSQL.

## Project Overview

FlowAssist is an integrated development platform that combines modern web technologies with AI capabilities. The platform consists of:

1. **Next.js Frontend**: A modern React-based web application with chat UI, tool toggles, and feedback mechanisms
2. **MCP Server**: Model Context Protocol server for AI orchestration, planning, and tool management
3. **Analytics Service**: Processes telemetry data to generate insights and improve AI performance
4. **n8n Workflow Automation**: With pre-configured AI workflows from the n8n self-hosted AI starter kit
5. **LangChain**: Custom chains and tools for advanced AI processing
6. **Ollama**: Open-source Large Language Model (LLM) server
7. **Qdrant**: Vector database for embeddings and semantic search
8. **PostgreSQL**: Shared database for all services
9. **Shared Memory**: Adapters for Qdrant and Redis for context management

All components are containerized using Docker and managed through Docker Compose, making the setup portable and easy to deploy.

## Project Structure

```
FlowAssist/
│
├── docker-compose.yml    # Main Docker Compose configuration
├── .env                  # Environment variables (copy from sample.env)
│
├── nextjs-app/           # Chat UI
│   ├── components/
│   │   ├── ChatStream.tsx
│   │   ├── ToolTogglePanel.tsx
│   │   ├── TraceViewer.tsx
│   │   └── FeedbackPrompt.tsx
│   ├── pages/
│   │   └── api/ask.ts    # Proxy to MCP
│   └── ...               # assets, styles, tests
│
├── mcp-server/           # Orchestrator
│   ├── router/           # Dispatch logic
│   ├── planners/         # (LLM/Rule) task planners
│   ├── context/          # Profile & memory injectors
│   ├── tools/            # Registry YAML + adapters
│   ├── telemetry/        # Trace + metrics exporter
│   └── ...
│
├── analytics-service/    # Kafka-consumer or cron job
│   ├── pipelines/        # Usage ↦ insights ↦ model-updates
│   └── reports/          # Persisted dashboards
│
├── n8n/                  # Workflows
│
├── langchain/            # Custom chains/tools
│
├── shared-memory/        # Qdrant + Redis adapters
│
├── qdrant-data/          # Vector database storage
├── ollama-data/          # Ollama models and configuration
└── pgdata/               # PostgreSQL data directory
```

## Services and Ports

| Service           | Description                                | Port  | URL                    |
|------------------|--------------------------------------------|-------|------------------------|
| Next.js          | Frontend web application                   | 3000  | http://localhost:3000  |
| MCP Server       | Model Context Protocol server              | 3001  | http://localhost:3001  |
| n8n              | Workflow automation with AI capabilities    | 5678  | http://localhost:5678  |
| Ollama           | LLM server running llama3.2                 | 11434 | http://localhost:11434 |
| Qdrant           | Vector database for embeddings             | 6333  | http://localhost:6333  |
| PostgreSQL       | Database server                            | 5432  | localhost:5432         |
| Analytics Service| Telemetry processing and insights          | 8080  | http://localhost:8080  |
| Kafka/Redpanda   | Event streaming for telemetry              | 9092  | localhost:9092         |
| Grafana          | Dashboards for metrics and traces          | 3000  | http://localhost:3000/grafana |

## Functional Principles

### Request Loop (Dynamic Version)

```
User ↔ Chat UI
     ↓   ↑ (explicit thumbs-up / down)
ask.ts → MCP /ask
         ├─ fetchUserProfile()             (Entra ID / ServiceNow)
         ├─ loadMemory()                   (Qdrant + Redis)
         ├─ filterTools(profile,toggles)
         ├─ plan = {steps[]}               (rule engine ∥ LLM planner)
         ├─ execute plan:                 (n8n, LangChain, REST, …)
         ├─ trace = {events,latencies}
         └─ return {answer, traceId}
UI ← answer + trace
UI → POST /feedback traceId, rating, comment
```

### Feedback-Driven Improvement

- **Immediate**: Rating propagates to analytics topic -> "hot" alert if many failures.
- **Periodic**: Analytics service recomputes tool-success matrix, prompt-quality metrics → produces YAML "tuning suggestions" consumed by MCP on redeploy.

### Context Management

- **Static**: Role, department, preferred language (Entra ID).
- **Dynamic**: Active project tickets (ServiceNow), recent docs.
- **Memory**: Last N messages (Redis), long-term embeddings (Qdrant).
- **Injection Rule**: Never exceed context-token-budget; ranking by recency × similarity.

### Governance & Security

- Tool registry YAML contains `permissions:` and `rate_limit:`.
- MCP enforces allow/block, logs any violation to telemetry/violations.

### Observability Stack

- Telemetry writes OpenTelemetry spans → Jaeger or Tempo.
- LangSmith integrated for LLM calls.
- Grafana dashboards read from PostgreSQL materialized views.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/FlowAssist.git
   cd FlowAssist
   ```

2. Copy the sample environment file:
   ```bash
   cp sample.env .env
   ```

3. Start all services:
   ```bash
   docker compose up -d
   ```

4. Access the services:
   - Next.js: http://localhost:3000
   - MCP Server: http://localhost:3001
   - n8n: http://localhost:5678 (default login: admin/password)
   - Ollama: http://localhost:11434
   - Qdrant: http://localhost:6333
   - PostgreSQL: localhost:5432 (username: postgres, password: postgres)

### Initial Setup

- The first time you start the services, Ollama will download the llama3.2 model, which may take some time depending on your internet connection.
- n8n will automatically import the AI workflows from the starter kit.

## Development

### Next.js Frontend

- The Next.js app is mounted as a volume, so changes will be reflected immediately.
- Access the application at http://localhost:3000.
- The app is configured with the standalone output option for optimal Docker deployment.

### MCP Server

- The Model Context Protocol server provides AI model integration capabilities.
- Source files are mounted as volumes for easy development.
- The server is built with TypeScript and runs on Node.js.
- Access the server at http://localhost:3001.

### n8n Workflow Automation

- n8n provides a visual workflow editor for creating automation workflows.
- Pre-configured AI workflows are imported from the n8n self-hosted AI starter kit.
- Access the n8n editor at http://localhost:5678 (login: admin/password).
- Workflows are persisted in the PostgreSQL database and the n8n/.n8n directory.

### Ollama LLM Server

- Ollama provides local LLM capabilities with the llama3.2 model.
- Models are stored in the ollama-data directory.
- Access the Ollama API at http://localhost:11434.
- Example API call: `curl http://localhost:11434/api/generate -d '{"model": "llama3.2", "prompt": "Hello world"}'`

### Qdrant Vector Database

- Qdrant provides vector search capabilities for AI applications.
- Data is stored in the qdrant-data directory.
- Access the Qdrant API at http://localhost:6333.
- Use the Qdrant dashboard at http://localhost:6333/dashboard.

### PostgreSQL Database

- PostgreSQL is used as the shared database for all services.
- Data is persisted in the pgdata directory.
- Connection details:
  - Host: localhost
  - Port: 5432
  - Username: postgres
  - Password: postgres
  - Databases: nextjs_db, n8n

## Environment Variables

Key environment variables (defined in .env):

- `NEXT_PUBLIC_API_URL`: URL for the MCP server (http://localhost:3001)
- `DATABASE_URL`: PostgreSQL connection string
- `N8N_ENCRYPTION_KEY`: Encryption key for n8n
- `N8N_USER_MANAGEMENT_JWT_SECRET`: JWT secret for n8n user management
- `OLLAMA_HOST`: Host for Ollama service (ollama:11434)

## AI Capabilities

### Pre-configured AI Workflows

The n8n instance comes with pre-configured AI workflows from the n8n self-hosted AI starter kit:

1. **Document Q&A**: Ask questions about documents using LLMs
2. **Text Generation**: Generate text using the Ollama LLM
3. **Semantic Search**: Search through documents using vector embeddings

### Integration Points

- Next.js frontend can communicate with the MCP server for AI capabilities
- n8n workflows can use Ollama for LLM processing
- Qdrant provides vector search for semantic queries
- All components can be orchestrated together using n8n workflows

## High-level GUI Mapping

| Screen area | Visible feature | Back-end tie-in |
|-------------|----------------|------------------|
| A. Chat pane | Streaming markdown answers | `/api/ask` SSE |
| B. Tool toggle drawer | Switches per tool, profile selector ("Admin", "Basic") | Stored in `user_tool_prefs` table → MCP filter |
| C. Trace timeline | Expandable disclosure list of steps, latencies, tool names | `GET /trace/:id` (MCP telemetry) |
| D. Feedback bar | 👍 / 👎 + free text ("Hallucination", "Slow", …) | `POST /feedback` → analytics pipeline |
| E. Insights dashboard | (Admin route) aggregated metrics, error clusters | Queries PostgreSQL views / Grafana iframe |

### Wireframe (text)

```
┌─────────────────── Chat ────────────────────┐
│ You ▸ "Summarise ticket SN12345"            │
│ AI  ▸ "Here is the summary…"                │
└──────────────────────────────────────────────┘
[Trace ▸]  [Enable Tool: Calendar ✓]  [👍|👎]
```

## Extending the Platform

### Adding New Models to Ollama

```bash
# Pull a new model
docker exec -it ollama ollama pull mistral

# List available models
docker exec -it ollama ollama list
```

### Creating Custom n8n Workflows

1. Access the n8n editor at http://localhost:5678
2. Create new workflows using the visual editor
3. Integrate with Ollama and Qdrant for AI capabilities

### Connecting Next.js to AI Services

The Next.js app can connect to:
- MCP server directly via http://mcp:3001
- n8n workflows via http://n8n:5678/webhook/
- Ollama via http://ollama:11434

## Implementation Checklist

The following tasks are required to finalize the framework:

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Extend docker-compose.yml with analytics-service + Kafka | DevOps | ☐ |
| 2 | Design PostgreSQL schema: traces, tool_usage, feedback | Backend | ☐ |
| 3 | Implement telemetry/ middleware in MCP (OpenTelemetry SDK) | Backend | ☐ |
| 4 | Build ToolTogglePanel.tsx + persist prefs via /api/tools | Frontend | ☐ |
| 5 | Add /feedback endpoint (traceId, rating, comment) | MCP | ☐ |
| 6 | Create initial Grafana dashboard (latency, fail-rate, NPS) | DevOps | ☐ |
| 7 | Implement context-ranking function (recency×similarity) | Backend | ☐ |
| 8 | Integrate LangSmith for all LLM calls | Backend | ☐ |
| 9 | Write planner stub (rule-based) + optional LangChain agent | AI Eng | ☐ |
| 10 | Import ServiceNow & Entra ID adapters (profile fetch) | Backend | ☐ |
| 11 | Security review: role-based tool gating, rate limits | SecOps | ☐ |
| 12 | End-to-end test script (Cypress) covering toggle ↔ trace ↔ feedback | QA | ☐ |
| 13 | Documentation: architecture diagram, Dev guide, Ops playbook | Tech Writer | ☐ |
| 14 | Pilot rollout: select 10 users, collect feedback | PM | ☐ |

By completing the checklist you will have:

- Full loop from user request → orchestration → transparent trace → explicit feedback → analytics → continuous improvement.
- A GUI that surfaces exactly why the assistant acted, and lets users steer capabilities on demand.
- An architecture ready for scaling: add new tools by dropping YAML + adapter, redeploy MCP.

## Troubleshooting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [n8n self-hosted AI starter kit](https://github.com/n8n-io/self-hosted-ai-starter-kit)
- [Model Context Protocol (MCP)](https://github.com/microsoft/modelcontextprotocol)
- [Ollama](https://github.com/ollama/ollama)
- [Qdrant](https://github.com/qdrant/qdrant)
- [Next.js](https://nextjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
