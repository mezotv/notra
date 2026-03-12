# syntax=docker/dockerfile:1
# Build from the monorepo root changes here
#   docker build -f apps/api/Dockerfile -t notra-api .

# ─── Stage 1: install dependencies ───────────────────────────────────────────
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

# Copy workspace manifests needed to resolve the full dependency graph
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/dashboard/package.json ./apps/dashboard/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/email/package.json ./packages/email/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all workspace deps (frozen lockfile for reproducibility)
RUN bun install --frozen-lockfile

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder

# Copy source for all packages the API depends on
COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN bun run build

# ─── Stage 3: production image ───────────────────────────────────────────────
FROM node:24-alpine AS runner

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 hono

WORKDIR /app

COPY --from=builder --chown=hono:nodejs /app/apps/api/dist/index.mjs ./dist/index.mjs

USER hono

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.mjs"]
