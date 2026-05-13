# Stage 1: Install dependencies
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

# Copy configuration files
COPY package.json bun.lock* bunfig.toml* ./

# Install dependencies with frozen lockfile for consistency
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the project
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.1-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build and necessary assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files
CMD ["bun", "server.js"]
