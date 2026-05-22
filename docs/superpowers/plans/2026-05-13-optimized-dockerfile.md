# Optimized Dockerfile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready, optimized Dockerfile for the Bun-based Next.js project using multi-stage builds and standalone output.

**Architecture:** Use a three-stage Docker build: `deps` (install), `builder` (compile), and `runner` (slim runtime). Leverage Next.js `output: 'standalone'` to minimize image size.

**Tech Stack:** Docker, Bun (`oven/bun`), Next.js.

---

### Task 1: Enable Standalone Output

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add output: 'standalone' to Next.js configuration**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
}

export default nextConfig
```

- [ ] **Step 2: Commit changes**

```bash
git add next.config.ts
git commit -m "chore: enable standalone output in next.config.ts"
```

---

### Task 2: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore with essential exclusions**

```text
node_modules
.next
.git
.gitignore
.dockerignore
Dockerfile
README.md
LICENSE
tests
playwright
playwright-report
playwright-ct.config.ts
playwright.config.ts
.agents
.claude
.vscode
.gemini
docs
bun.lock
# Exclude environment variables
.env*.local
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

### Task 3: Create Optimized Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the multi-stage Dockerfile**

```dockerfile
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
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add optimized multi-stage Dockerfile"
```

---

### Task 4: Final Verification (Manual)

- [ ] **Step 1: Instruct user on how to test the build**
Inform the user they can test the build by running:
`docker build -t kammi-id .`
And run it with:
`docker run -p 3000:3000 kammi-id`
