<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Skill Activation Protocol

**CRITICAL:** You MUST consider and invoke relevant skills BEFORE any response or action.

- **Shadcn & BaseUI Rule:** Always invoke both `shadcn` and `base-ui-docs` skills whenever creating, modifying, or debugging components that utilize Shadcn UI or BaseUI primitives. **Note: This project specifically uses BaseUI as the primitive layer for Shadcn, NOT RadixUI.**
- If there is even a 1% chance a skill might apply to the task, invoke it using the `Skill` tool.
- This check must happen BEFORE clarifying questions, exploration, or implementation.
- Follow the specific workflow defined in the invoked skill exactly.

**VERIFICATION PROTOCOL:** Always check for errors in Next.js DevTools using `get_errors` immediately after completing any task or fixing a bug to ensure no new regressions were introduced.

# Coding Standards

- **Arrow Functions:** Always write functions and components in arrow-format (e.g., `const MyComponent = () => {}`) instead of traditional function declarations (e.g., `function MyComponent() {}`).
- **Exceptions:** This rule does NOT apply to generated code in `src/components/shadcn/`, `src/lib/shadcn/`, or any files outside the `src` directory.

# Codebase Organization

## General Principles

- **Colocation:** Components must be colocated near the route that uses them (inside `_components` folders) or globally inside `src/components/` if they are reusable.
- **Atomic Structure:** One component or function per folder.
- **Named-File Atomic Pattern:**
  - Main file uses the component name (e.g., `my-component.tsx`).
  - An `index.ts` file is used for barrel exports (`export * from './my-component'`).

## Component Folder Conventions

Each component folder may contain the following supporting files:

- `index.ts`: Barrel file for re-exports.
- `action.ts`: Next.js Server Actions (with Zod validation & Optimistic updates).
- `data.ts`: Server-side data fetching (with 'use cache', cacheLife, cacheTag).
- `store.ts`: Nanostores state management (minimalist, reactive state).
- `types.ts`: Component-specific type definitions.
- `constants.ts`: Static values and configuration.
- `utils.ts`: Local helper functions.
- `*.test.ts`: Test files.

## Engineering Standards (Ultra-Atomic)

- **Composition:** Use Compound Components pattern for reusable components to avoid prop-drilling and maximize flexibility.
- **RSC-First:** Keep `'use client'` at the leaf-component level to maximize Server Component usage.
- **Caching:** Implement granular cache invalidation using `cacheTag` in `data.ts` and `updateTag` in `action.ts`.
- **A11y:** All components must follow Web Interface Guidelines (semantic HTML, aria-labels, keyboard navigation).
- **Performance:** Use `useOptimistic` and `useTransition` for seamless data mutations.

# Mandatory Quality Gates

## Pre-Commit Checks (required before every commit)

Run all of the following before committing. All must pass with zero errors:

```bash
bun run format        # auto-fix formatting
bun run lint:fix      # auto-fix linting
bun run check:types   # must have zero TypeScript errors
bun test              # must have zero test failures
```

Do NOT rely on CI to fix formatting or linting. Run these locally first. CI auto-fixes are a safety net only.

## Pre-Push Checks (required before every push)

```bash
bun run test:docker   # Docker image must build successfully
bun run test:ct       # Component tests must pass
```

E2E tests (`bun run test:e2e`) do not need to run locally — they run automatically in CI.

## Pre-Session-End Checklist

Before declaring any task complete, verify ALL of the following:

- [ ] All unit and integration tests pass: `bun test`
- [ ] TypeScript is clean: `bun run check:types`
- [ ] No ESLint errors: `bun run check:lint`
- [ ] Docker build succeeds: `bun run test:docker`
- [ ] No new regressions in Next.js DevTools: `get_errors`

## CI Behavior (reference)

CI runs automatically on every push and PR:

1. Auto-fixes formatting (`bun run format`) and linting (`bun run lint:fix`)
2. If fixes were made, commits them back to the branch with `[skip ci]`
3. Checks types, runs unit tests, integration tests, component tests, E2E tests — in that order
4. **Container build only runs if ALL tests pass** (`needs: [test]`)
5. Smoke test runs after container build via `GET /api/health` with `X-CI-Token` header

Format and lint checks always run **before** tests in CI. This order must not change.

## Healthcheck Endpoint

`GET /api/health` returns `200 OK` (plain text) only when the `X-CI-Token` request header matches the `CI_HEALTH_TOKEN` environment variable. Returns `404` for all other requests — it is indistinguishable from a non-existent route to browsers. Used by CI smoke test only.

## Organization Exceptions

The following are exempt from the Atomic Structure and Colocation rules:

- **Shadcn UI:** All files in `src/components/shadcn/` and `src/lib/shadcn/` (generated by CLI).
- **Next.js Convention Files:** Special files used for routing, including but not limited to: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, and `route.ts`.
