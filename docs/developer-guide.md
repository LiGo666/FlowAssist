# FlowAssist Developer Guide

This guide provides comprehensive instructions for developers working on the FlowAssist project. It covers setup, development workflows, and best practices.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/FlowAssist.git
cd FlowAssist
```

2. **Set up environment variables**

```bash
cp sample.env .env
```

Edit the `.env` file to configure your environment variables.

3. **Start the development environment**

```bash
docker-compose up -d
```

This will start all required services:
- Next.js frontend
- MCP server
- PostgreSQL database
- Redis cache
- Qdrant vector database
- Ollama LLM service
- n8n workflow engine
- Redpanda (Kafka)
- Analytics service
- Grafana dashboards

4. **Access the services**

- Frontend: http://localhost:3000
- MCP Server API: http://localhost:3001
- n8n: http://localhost:5678
- Grafana: http://localhost:3000/grafana
- Redpanda Console: http://localhost:8080
- Qdrant UI: http://localhost:6333/dashboard

## Project Structure

```
FlowAssist/
├── .github/                # GitHub workflows and templates
├── analytics-service/      # Python analytics service
├── cypress/                # End-to-end tests
├── docs/                   # Documentation
├── frontend/               # Next.js frontend application
├── grafana/                # Grafana dashboards and configuration
├── init-scripts/           # Database initialization scripts
├── mcp-server/             # Main Control Plane server
│   ├── src/
│   │   ├── context/        # Context management
│   │   ├── langsmith/      # LangSmith integration
│   │   ├── planners/       # AI planning components
│   │   ├── security/       # Security and tool registry
│   │   ├── telemetry/      # Telemetry and observability
│   │   └── index.ts        # Main entry point
├── n8n-ai-kit/             # n8n AI workflows
└── docker-compose.yml      # Docker Compose configuration
```

## Key Components

### MCP Server

The MCP (Main Control Plane) server is the central orchestration service that handles:

- User requests and responses
- Tool management and execution
- Telemetry and observability
- Security and rate limiting

#### Adding a New Tool

1. Create a new tool implementation in the appropriate directory
2. Register the tool in the tool registry
3. Implement security checks using the `toolRegistry.canUseTool()` method
4. Add telemetry spans for tool execution

Example:

```typescript
import { toolRegistry } from '../security/tool-registry';
import { createToolSpan, endToolSpan } from '../telemetry/middleware';

export async function myNewTool(userId: string, params: any) {
  // Check if user can use this tool
  const canUse = await toolRegistry.canUseTool('myNewTool', userId);
  if (!canUse) {
    throw new Error('User not authorized to use this tool');
  }
  
  // Create telemetry span
  const span = createToolSpan('myNewTool', params);
  
  try {
    // Tool implementation
    const result = await doSomething(params);
    
    // Record tool usage for rate limiting
    await toolRegistry.recordToolUsage(userId, 'myNewTool');
    
    // End telemetry span with success
    endToolSpan(span, { result });
    
    return result;
  } catch (error) {
    // End telemetry span with error
    endToolSpan(span, { error });
    throw error;
  }
}
```

### Telemetry

The telemetry system uses OpenTelemetry to track:

- Request traces
- Tool usage
- Performance metrics
- Errors and exceptions

#### Adding Custom Telemetry

```typescript
import { tracer } from '../telemetry/tracer';

// Create a custom span
const span = tracer.startSpan('customOperation');
span.setAttribute('user.id', userId);

try {
  // Your code here
  span.end();
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
  throw error;
}
```

### Context Management

The context management system handles:

- Short-term memory via Redis
- Vector search via Qdrant
- Context ranking by recency and similarity

#### Using the Context Ranker

```typescript
import { ContextRanker } from '../context/ranking';

const ranker = new ContextRanker();

// Get relevant context for a user query
const relevantContext = await ranker.rankContextSources(
  'user query text',
  'user-123',
  { recencyWeight: 0.4, similarityWeight: 0.6 }
);

// Store new context
await ranker.storeContext({
  id: 'context-123',
  content: 'Context content',
  metadata: {
    userId: 'user-123',
    source: 'chat',
    timestamp: Date.now(),
    type: 'message'
  }
});
```

## Testing

### Unit Testing

Run unit tests with:

```bash
cd mcp-server
npm test
```

### End-to-End Testing

Run Cypress tests with:

```bash
npm run cypress:open
```

or headlessly:

```bash
npm run cypress:run
```

## Deployment

### Production Deployment

1. Build the Docker images:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

2. Deploy the stack:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- On pull request: Run tests and linting
- On merge to main: Build and deploy to staging
- On release tag: Deploy to production

## Best Practices

### Code Style

- Follow the TypeScript style guide
- Use ESLint and Prettier for code formatting
- Write meaningful comments and documentation

### Security

- Never hardcode credentials
- Always validate user input
- Use the security module for authorization
- Implement rate limiting for all external APIs

### Performance

- Use caching where appropriate
- Optimize database queries
- Monitor performance with telemetry
- Use pagination for large result sets

## Troubleshooting

### Common Issues

1. **Docker services not starting**
   - Check Docker logs: `docker-compose logs -f [service]`
   - Verify port availability: `netstat -tuln`

2. **Database connection issues**
   - Check PostgreSQL logs: `docker-compose logs -f db`
   - Verify environment variables in `.env`

3. **LLM service errors**
   - Check Ollama logs: `docker-compose logs -f ollama`
   - Verify model availability: `curl http://localhost:11434/api/tags`

### Debugging Tools

- Use Grafana dashboards for monitoring
- Check telemetry traces for request flow
- Use LangSmith for LLM call debugging
- Review logs in the Docker containers
