FROM n8nio/n8n:latest

USER root

# Create .n8n directory with proper permissions
RUN mkdir -p /home/node/.n8n && \
    chown -R node:node /home/node/.n8n && \
    chmod -R 755 /home/node/.n8n

# Switch back to node user
USER node

# The rest of the configuration will come from environment variables in docker-compose.yml
