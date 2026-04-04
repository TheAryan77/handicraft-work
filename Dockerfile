FROM node:20-alpine AS base

# --- DEPENDENCIES ---
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy package definitions for workspaces
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/admin/package.json ./apps/admin/
COPY packages/db/package.json ./packages/db/

# We MUST copy the prisma schema early because our db package runs `prisma generate` during postinstall!
COPY packages/db/prisma ./packages/db/prisma

# Install all dependencies across the monorepo cleanly
RUN npm ci

# --- BUILDER ---
FROM base AS builder
WORKDIR /app
# Copy the installed node_modules
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the monorepo source code
COPY . .

# Build all applications via Turbo (this builds API, Web, and Admin simultaneously)
RUN npx turbo run build

# --- RUNNER ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy over the compiled builder state
COPY --from=builder /app ./

# Create a master start script!
# This reads an environment variable from Render to decide WHICH app to spin up inside this container
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ "$START_SERVICE" = "api" ]; then' >> /app/start.sh && \
    echo '  echo "Starting API on port $PORT..."' >> /app/start.sh && \
    echo '  cd apps/api && npm run start' >> /app/start.sh && \
    echo 'elif [ "$START_SERVICE" = "admin" ]; then' >> /app/start.sh && \
    echo '  echo "Starting Admin on port $PORT..."' >> /app/start.sh && \
    echo '  cd apps/admin && npm run start' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "Starting Web Frontend on port $PORT..."' >> /app/start.sh && \
    echo '  cd apps/web && npm run start' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    chmod +x /app/start.sh

# Render injects the continuous PORT dynamically; we default it to 3000 if testing locally
ENV PORT=3000
EXPOSE $PORT

# Start the router script
CMD ["/app/start.sh"]
