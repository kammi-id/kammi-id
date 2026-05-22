# Design Spec: Optimized Bun-based Dockerfile for Next.js

This document outlines the design for an optimized, production-ready Dockerfile for a Bun-based Next.js project.

## 1. Objectives
- **Minimal Image Size**: Use multi-stage builds and `oven/bun:slim` as the final base.
- **Next.js Standalone**: Leverage Next.js's native standalone output to minimize runtime dependencies.
- **Security**: Run the application as a non-root user.
- **Build Efficiency**: Optimize Docker layer caching for Bun dependencies.
- **Cleanliness**: Use `.dockerignore` to prevent unnecessary files from entering the build context.

## 2. Architecture

### Stage 1: Dependency Installation (`deps`)
- Base: `oven/bun:alpine` (Fast and lightweight).
- Action: Copy `package.json`, `bun.lock`, and `bunfig.toml`. Run `bun install --frozen-lockfile`.
- Goal: Create a reusable layer for dependencies.

### Stage 2: Builder (`builder`)
- Base: `oven/bun:alpine`.
- Action: Copy dependencies from `deps`, copy source code, and run `bun run build`.
- Configuration: Ensure `next.config.ts` has `output: 'standalone'`.
- Goal: Compile the application and generate standalone assets.

### Stage 3: Runner (`runner`)
- Base: `oven/bun:slim`.
- Action:
  - Create a non-root user/group (`nextjs`).
  - Copy `.next/standalone`, `.next/static`, and `public` from `builder`.
  - Set environment variables (e.g., `NODE_ENV=production`, `PORT=3000`).
  - Expose port 3000.
  - Command: `bun server.js`.
- Goal: A lean, secure, and high-performance runtime image.

## 3. Implementation Details

### Configuration Changes
- **`next.config.ts`**: Add `output: 'standalone'`. This is critical for the runner stage to work without a full `node_modules` folder.

### Files to Create
- **`Dockerfile`**: The multi-stage build definition.
- **`.dockerignore`**: Exclude `node_modules`, `.next`, `.git`, `tests`, `playwright`, and other non-essential files.

## 4. Error Handling & Validation
- **Build Check**: Verify `bun run build` completes successfully in the container.
- **Runtime Check**: Ensure the container starts and the server listens on the correct port.
- **Size Audit**: Compare the final image size against a standard non-optimized build.

## 5. Security Considerations
- Use of `slim` base image reduces the attack surface.
- Strict non-root user execution prevents container breakout risks.
- `.dockerignore` prevents accidental leakage of secrets (e.g., `.env` files) into the image layers.
