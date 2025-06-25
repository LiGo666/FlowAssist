FROM node:18-alpine

WORKDIR /app

# Next.js collects completely anonymous telemetry data about general usage
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development
ENV PORT=3000

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies inside the container
RUN npm ci

EXPOSE 3000

# Run Next.js in development mode for live reload
CMD ["npm", "run", "dev"]
