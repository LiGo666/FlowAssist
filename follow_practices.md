# FlowAssist Development Practices

This document outlines the development practices and conventions used in the FlowAssist project.

## Docker and Container Practices

### Build Inside the Container
- **CRITICAL**: All build and install activities (e.g., `npm install`/`npm ci`) MUST happen inside the container, NEVER on the host
- Always install dependencies inside the container during build, even when using volume mounts
- Never map host `node_modules` into containers (no volume mounts for `node_modules`)
- For Node.js applications:
  - Use `npm ci` in Dockerfiles to ensure consistent dependency installation
  - Install dependencies directly in each stage that needs them in multi-stage builds
  - Don't copy `node_modules` between build stages
  - When using volume mounts for source code, still copy package.json/package-lock.json and run npm ci in the Dockerfile

### Docker Compose Structure
- One main `docker-compose.yml` file in the root directory
- Individual Dockerfiles in their respective service subdirectories
- Use appropriate environment variables in docker-compose.yml for configuration
- Use named volumes for persistent data
- Avoid bind mounts that can cause dependency or permission issues

### Container Organization
- Only create standalone containers for services with "stand-alone" character
- Smaller components (server+client) should be integrated into the Next.js setup
- Follow the principle of separation of concerns for services
- Use appropriate networking between containers

## Documentation Files

The following `.md` files in the main folder should be kept updated:

| File | Purpose | Update When |
|------|---------|-------------|
| `README.md` | Main project documentation | Major changes to project structure or setup |
| `CONTRIBUTING.md` | Guidelines for contributors | Changes to development workflow |
| `interface_map.md` | Map of all interfaces | New interfaces are added or existing ones modified |
| `follow_practices.md` | Development practices | New practices are adopted |

## Development Workflow

- Use Docker Compose for local development
- Run builds inside containers to ensure consistency
- Test changes in the containerized environment before committing
- Update documentation when making significant changes
