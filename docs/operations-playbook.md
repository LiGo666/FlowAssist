# FlowAssist Operations Playbook

This playbook provides guidance for operating, monitoring, and maintaining the FlowAssist platform in production environments.

## System Architecture Overview

FlowAssist consists of several interconnected services:

- **Frontend**: Next.js application
- **MCP Server**: Node.js API server
- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for short-term memory
- **Vector DB**: Qdrant for semantic search
- **LLM Service**: Ollama for AI capabilities
- **Event Streaming**: Redpanda (Kafka-compatible)
- **Workflow Engine**: n8n for automation
- **Analytics**: Python-based analytics service
- **Monitoring**: Grafana dashboards

## Deployment

### Initial Deployment

1. **Prerequisites**:
   - Docker and Docker Compose installed
   - Domain name configured with DNS
   - SSL certificates available

2. **Deployment Steps**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/FlowAssist.git
   cd FlowAssist
   
   # Configure environment
   cp sample.env .env
   # Edit .env with production values
   
   # Deploy with Docker Compose
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Verify Deployment**:
   ```bash
   # Check all services are running
   docker-compose ps
   
   # Check logs for any errors
   docker-compose logs -f
   ```

### Updates and Rollbacks

1. **Update Procedure**:
   ```bash
   # Pull latest changes
   git pull
   
   # Update containers
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Rollback Procedure**:
   ```bash
   # Revert to a specific git tag or commit
   git checkout v1.2.3
   
   # Redeploy
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Monitoring

### Key Metrics

1. **System Health**:
   - CPU, memory, and disk usage
   - Container status and uptime
   - Database connections and query performance

2. **Application Metrics**:
   - Request latency (p50, p95, p99)
   - Error rates
   - Tool usage frequency
   - User engagement metrics

3. **LLM Performance**:
   - Token usage
   - Generation time
   - Error rates
   - User feedback scores

### Monitoring Tools

1. **Grafana Dashboards**:
   - Access at: `https://your-domain.com/grafana`
   - Default credentials in `.env` file
   - Main dashboards:
     - System Overview
     - Request Telemetry
     - Tool Usage
     - User Feedback

2. **Log Management**:
   - Centralized logging with Docker logs
   - Log rotation configured in Docker Compose
   - Critical errors are alerted via webhook

3. **Alerting**:
   - Configured in Grafana for critical metrics
   - Alerts sent to Slack/Teams/Email
   - On-call rotation managed via PagerDuty

## Maintenance Procedures

### Database Maintenance

1. **Backup Procedure**:
   ```bash
   # Create a backup
   docker-compose exec db pg_dump -U postgres nextjs_db > backup_$(date +%Y%m%d).sql
   
   # Store backup offsite
   aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
   ```

2. **Restore Procedure**:
   ```bash
   # Stop services
   docker-compose stop
   
   # Restore from backup
   cat backup_20250101.sql | docker-compose exec -T db psql -U postgres nextjs_db
   
   # Restart services
   docker-compose start
   ```

3. **Database Optimization**:
   ```bash
   # Run VACUUM ANALYZE
   docker-compose exec db psql -U postgres -c "VACUUM ANALYZE;" nextjs_db
   
   # Update materialized views
   docker-compose exec db psql -U postgres -c "REFRESH MATERIALIZED VIEW telemetry.tool_usage_summary;" nextjs_db
   ```

### LLM Model Management

1. **Model Updates**:
   ```bash
   # Pull new model version
   docker-compose exec ollama ollama pull llama3.2:latest
   
   # Verify model is working
   curl -X POST http://localhost:11434/api/generate -d '{"model": "llama3.2", "prompt": "Hello, world"}'
   ```

2. **Model Performance Tuning**:
   - Adjust parameters in `.env` file
   - Monitor token usage and latency in Grafana
   - A/B test different models with user segments

### Security Maintenance

1. **Regular Security Tasks**:
   - Update Docker images monthly
   - Rotate API keys quarterly
   - Review access logs weekly
   - Run security scans bi-weekly

2. **Security Incident Response**:
   - Isolate affected services
   - Preserve logs and evidence
   - Analyze root cause
   - Apply fixes and verify
   - Document incident and response

## Troubleshooting

### Common Issues

1. **Service Not Starting**:
   - Check Docker logs: `docker-compose logs [service]`
   - Verify environment variables
   - Check for port conflicts: `netstat -tuln`
   - Ensure volumes have correct permissions

2. **High Latency**:
   - Check system resources (CPU, memory)
   - Review database query performance
   - Check LLM service load
   - Verify network connectivity between services

3. **Database Connection Issues**:
   - Verify PostgreSQL is running: `docker-compose ps db`
   - Check connection string in environment variables
   - Look for connection limit issues in logs
   - Restart PostgreSQL if needed: `docker-compose restart db`

4. **LLM Service Errors**:
   - Check Ollama logs: `docker-compose logs ollama`
   - Verify model is downloaded and available
   - Check for memory constraints
   - Restart Ollama service: `docker-compose restart ollama`

### Diagnostic Commands

```bash
# Check system status
docker-compose ps

# View logs for a specific service
docker-compose logs -f mcp-server

# Check database connection
docker-compose exec mcp-server node -e "const { Pool } = require('pg'); const pool = new Pool({host: process.env.POSTGRES_HOST}); pool.query('SELECT 1').then(() => console.log('DB connection successful')).catch(e => console.error('DB connection failed:', e)).finally(() => pool.end())"

# Test Redis connection
docker-compose exec mcp-server node -e "const redis = require('redis'); const client = redis.createClient({url: 'redis://redis:6379'}); client.connect().then(() => console.log('Redis connection successful')).catch(e => console.error('Redis connection failed:', e)).finally(() => client.quit())"

# Check Kafka topics
docker-compose exec redpanda rpk topic list

# Verify Qdrant collections
curl http://localhost:6333/collections
```

## Scaling

### Horizontal Scaling

1. **Frontend Scaling**:
   - Deploy behind a load balancer
   - Use sticky sessions if needed
   - Scale replicas based on traffic

2. **API Server Scaling**:
   - Use Docker Swarm or Kubernetes for orchestration
   - Configure auto-scaling based on CPU/memory usage
   - Ensure stateless design for easy scaling

3. **Database Scaling**:
   - Implement read replicas for query-heavy workloads
   - Consider sharding for large datasets
   - Use connection pooling effectively

### Vertical Scaling

1. **Resource Allocation**:
   - Increase container resource limits in Docker Compose
   - Optimize for specific workloads (CPU vs. memory)
   - Monitor resource usage to identify bottlenecks

2. **Performance Tuning**:
   - PostgreSQL: Adjust shared_buffers, work_mem, etc.
   - Redis: Configure maxmemory and eviction policies
   - Node.js: Set appropriate garbage collection parameters

## Disaster Recovery

### Backup Strategy

1. **Data Backups**:
   - Database: Daily full backups, hourly incremental
   - Vector DB: Weekly full backups
   - Configuration: Version-controlled in git
   - User content: Daily backups to object storage

2. **Backup Verification**:
   - Monthly restore tests
   - Automated backup verification scripts
   - Offsite backup storage

### Recovery Procedures

1. **Complete System Recovery**:
   ```bash
   # Deploy infrastructure
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d db redis
   
   # Restore database
   cat backup_latest.sql | docker-compose exec -T db psql -U postgres nextjs_db
   
   # Start remaining services
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Partial Recovery**:
   - Database only: Restore from backup, verify data integrity
   - LLM models: Re-download models from Ollama repository
   - Vector DB: Restore from backup, rebuild indexes

## Compliance and Governance

### Data Retention

- User data: Retained according to privacy policy
- Telemetry data: Anonymized after 90 days
- Logs: Retained for 30 days
- Backups: Retained for 90 days

### Access Control

- Role-based access to admin interfaces
- API key rotation every 90 days
- Audit logging for all administrative actions
- Two-factor authentication for admin access

### Compliance Checks

- Monthly security scans
- Quarterly access reviews
- Annual penetration testing
- Regular compliance self-assessments

## Appendix

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| POSTGRES_HOST | PostgreSQL hostname | db | Yes |
| POSTGRES_PORT | PostgreSQL port | 5432 | Yes |
| POSTGRES_DB | PostgreSQL database name | nextjs_db | Yes |
| POSTGRES_USER | PostgreSQL username | postgres | Yes |
| POSTGRES_PASSWORD | PostgreSQL password | postgres | Yes |
| REDIS_URL | Redis connection URL | redis://redis:6379 | Yes |
| KAFKA_BOOTSTRAP_SERVERS | Kafka/Redpanda servers | redpanda:9092 | Yes |
| TELEMETRY_TOPIC | Kafka topic for telemetry | telemetry | Yes |
| FEEDBACK_TOPIC | Kafka topic for feedback | feedback | Yes |
| LANGSMITH_API_KEY | LangSmith API key | | No |
| LANGSMITH_PROJECT | LangSmith project name | flowassist | No |

### Service Dependencies

```
Frontend → MCP Server → Ollama LLM
                      → PostgreSQL
                      → Redis
                      → Qdrant
                      → Redpanda
MCP Server → Analytics Service
          → Grafana
n8n → MCP Server API
```

### Contact Information

- **Technical Support**: support@flowassist.example.com
- **Emergency Contact**: oncall@flowassist.example.com
- **Security Issues**: security@flowassist.example.com
