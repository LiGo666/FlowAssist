FROM node:18-alpine

WORKDIR /app

# Install TypeScript and other necessary tools
RUN npm install -g typescript shx

# Copy all source files
COPY . /app/

# Install dependencies
RUN npm install

# Create dist directory
RUN mkdir -p dist

# Compile TypeScript files
RUN tsc

# Copy instructions.md to dist
RUN cp instructions.md dist/ && chmod +x dist/*.js

# Expose the port the server listens on
EXPOSE 3001

# Start the server
CMD ["node", "dist/streamableHttp.js"]