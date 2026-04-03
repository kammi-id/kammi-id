# Agent Instructions & Steering

The role of this file is to describe specific steering requirements and confusion points. Do NOT summarize the codebase here; rely on your ability to explore the file system and read `package.json`.

## External Agent Rules

All directives in this file are also formal established agent rules located in `.agent/rules/*.md`. Agents should refer to those specific markdown files for additional detailed context on tools and rules.

## File Modification Policy (CRITICAL)

**ALL files in this project are READ-ONLY by default.**
You are strictly forbidden from creating, editing, refactoring, or deleting any files unless the developer explicitly instructs you to do so. If you discover a bug, see an opportunity for improvement, or think a file should be changed:

1. **DO NOT** make the change autonomously.
2. **DO NOT** write to the file system.
3. **DO** explain the issue and wait for the developer's explicit permission before proceeding with any file modification tools.

## The "Surprise" Rule (Priority)

If you encounter a pattern, file structure, or piece of logic in this project that surprises you or seems confusing, do NOT just work around it.

1.  **Alert the developer immediately.**
2.  **Propose a refactor** to make the code "self-documenting" for future agents.
3.  **Once resolved, document the "why"** in this file only if a codebase change wasn't possible.

## Environment & Tooling Constraints

### Next.js Initialization

When starting work on this project, automatically call the `init` tool from the `next-devtools-mcp` server **FIRST**. This establishes proper context and ensures all Next.js queries use official documentation.

### Bun-Native

This is a strict Bun project. Always use `bun` commands (`bun run`, `bun test`, `bunx`). If you see a `node_modules` folder, ignore it; rely on the Bun runtime and its native APIs (e.g., `Bun.file`, `Bun.sql`) where applicable.

### Database

We use `drizzle-orm/bun-sql`. If you find yourself reaching for `pg` or `postgres.js` drivers, you are making a mistake. Refer to `src/db/db.ts` for the singleton connection.

## Development Philosophy

### Greenfield Status

This project is in active early development. You have permission to be bold. If a schema change in `src/db/schemas/` or a structural change in `src/app/` makes a task significantly cleaner, propose the change rather than trying to fit logic into a suboptimal existing structure.

### Next.js Conventions

This is a Next.js 16 App Router project. Never implement raw `Bun.serve` for routing. Stay within the `src/app` conventions (Server Actions, RSC).

## Common Friction Points

### Tailwind v4

We use Tailwind CSS v4. Ensure you are not using v3-specific configurations or plugins that are now deprecated or built-in.

### Shadcn & Base UI

- When working with Shadcn components, always consult their MCP server or alternatively https://ui.shadcn.com/llms.txt.
- We are using Base UI variant of Shadcn components, always consult their docs when working with Base UI primitives at https://base-ui.com/llms.txt.
- You are prohibited to directly alter Shadcn generated files (located in `src/components/shadcn` and `src/lib/shadcn`). Always run Shadcn CLI to generate/regenerate them.

## Agent Workflows

### Sequential Thinking

You must use the Sequential Thinking MCP server (if available) to analyze, plan, and break down the problem BEFORE executing _ANY_ tasks or file modifications. Do not proceed with execution until the sequential thinking process is complete and you have a clear plan.
