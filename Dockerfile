# Stage 1: Build stage (Node 22-alpine, installs dependencies, builds static console)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install dependencies, ignore errors if no package.json exists yet
RUN npm install --no-audit --no-fund || true
COPY . .
# Build static console, ignore errors if no build script exists
RUN npm run build || true

# Stage 2: Gateway runner (Node 22-alpine)
FROM node:22-alpine AS gateway
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3001 4173
CMD ["node", "apps/gateway/src/server.js"]

# Stage 3: Python multi-agent runtime (Python 3.11-slim)
FROM python:3.11-slim AS agents
WORKDIR /app
COPY requirements.txt ./
# Install google-antigravity agents dependencies
RUN pip install --no-cache-dir -r requirements.txt || true
COPY . .
EXPOSE 8000
CMD ["python", "-m", "agents.main"]
