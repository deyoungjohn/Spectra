# Dockerfile for Spectra Backend and Agent Services
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git bash

# Copy package manifests
COPY package.json package-lock.json turbo.json eslint.config.js ./
COPY packages/core/package.json ./packages/core/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY apps/backend/package.json ./apps/backend/
COPY apps/agent/package.json ./apps/agent/
COPY apps/web/package.json ./apps/web/

# Install all workspace dependencies
RUN npm ci

# Copy full source tree
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build core, backend, and agent packages
RUN npx tsc --project packages/core/tsconfig.json
RUN npx tsc --project packages/ui/tsconfig.json
RUN npx tsc --project apps/backend/tsconfig.json
RUN npx tsc --project apps/agent/tsconfig.json

# ── Runtime Stage ──
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy workspace packages and builds
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/agent/package.json ./apps/agent/
COPY --from=builder /app/apps/agent/dist ./apps/agent/dist

EXPOSE 3001

# Default command starts the Spectra Backend (Express + WebSockets + Telegram)
CMD ["node", "apps/backend/dist/index.js"]
