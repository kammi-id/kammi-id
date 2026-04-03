---
description: Next.js Initialization and Conventions
alwaysOn: true
---

# Next.js Initialization

When starting work on this project, automatically call the `init` tool from the `next-devtools-mcp` server **FIRST**. This establishes proper context and ensures all Next.js queries use official documentation.

# Next.js Conventions

This is a Next.js 16 App Router project. Never implement raw `Bun.serve` for routing. Stay within the `src/app` conventions (Server Actions, RSC).
