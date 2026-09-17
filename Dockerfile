# Stage 1: Install dependencies
FROM oven/bun:1.4.0 AS deps
WORKDIR /app

# Copy configuration files
COPY package.json bun.lock* bunfig.toml* ./

# Install dependencies with frozen lockfile for consistency
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1.4.0 AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the project
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.4.0-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Set correct permissions for prerender cache and image optimization cache
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

# Copy standalone build and necessary assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ADR 0008: the runner carries duplicate preflight, Drizzle's runtime
# migrator, and migration files so a one-shot container can check and migrate
# the database before the application starts.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src/db/__migrations ./src/db/__migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/scripts/check-duplicates.ts ./src/scripts/check-duplicates.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/scripts/migrate.ts ./src/scripts/migrate.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db-guard ./src/lib/db-guard
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "server.js"]
