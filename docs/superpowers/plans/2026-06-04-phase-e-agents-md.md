# Phase E: AGENTS.md Rules Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mandatory pre-commit, pre-push, and pre-session-end rules to AGENTS.md so all future agentic and human contributors are gated by tests and quality checks.

**Architecture:** Single file edit. No code changes.

**Prerequisites:** Phases D, C, A, B complete and all tests passing.

---

## Task 1: Update AGENTS.md with Mandatory Rules

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Read the current AGENTS.md**

```bash
cat AGENTS.md
```

- [ ] **Step 2: Add the mandatory checks section**

After the existing content in `AGENTS.md`, append the following section. Find a logical location — after the existing coding standards, before or after the organization rules:

```markdown
# Mandatory Quality Gates

## Pre-Commit Checks (required before every commit)

Run these commands in order. All must pass with zero errors before committing:

\`\`\`bash
bun run format        # auto-fix formatting
bun run lint:fix      # auto-fix linting
bun run check:types   # must have zero TypeScript errors
bun test              # must have zero test failures
\`\`\`

Do NOT rely on CI to fix formatting or linting. Run these locally first.

## Pre-Push Checks (required before every push)

\`\`\`bash
bun run test:docker   # Docker image must build successfully
bun run test:ct       # Playwright component tests must pass
\`\`\`

E2E tests (`bun run test:e2e`) do not need to run locally — they run in CI automatically.

## Pre-Session-End Checklist

Before declaring any task complete, verify all of the following:

- [ ] All unit and integration tests pass: `bun test`
- [ ] TypeScript is clean: `bun run check:types`
- [ ] ESLint is clean: `bun run check:lint`
- [ ] Docker build succeeds: `bun run test:docker`
- [ ] No new errors in Next.js DevTools: `get_errors`

## CI Behavior (for reference)

CI runs automatically on every push and PR. It:

1. Auto-fixes formatting (`bun run format`) and linting (`bun run lint:fix`)
2. If fixes were made, commits them back to the branch with `[skip ci]`
3. Runs type check, unit tests, integration tests, component tests, E2E tests
4. **Only runs Docker build if all tests pass** (`needs: [test]`)
5. Runs smoke test after Docker build

Format and lint checks run **before** all tests in CI. This order must not be changed.

## Healthcheck Endpoint

`GET /api/health` returns `200 OK` (plain text) only when `X-CI-Token` header matches `CI_HEALTH_TOKEN` env var. Returns `404` for all other requests. Used by CI smoke test. Not for browser access.
```

- [ ] **Step 3: Verify the file looks correct**

```bash
cat AGENTS.md | tail -50
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add mandatory quality gates to AGENTS.md"
```

---

## Task 2: Sync Rules to CLAUDE.md (if needed)

**Files:**
- Possibly modify: `CLAUDE.md`

- [ ] **Step 1: Check if CLAUDE.md references AGENTS.md**

```bash
cat CLAUDE.md
```

If `CLAUDE.md` includes `@AGENTS.md`, the rules will be inherited automatically — no changes needed.

If not, add a reference or sync the key rules.

- [ ] **Step 2: Commit if changed**

```bash
git diff --quiet CLAUDE.md || (git add CLAUDE.md && git commit -m "docs: sync mandatory rules to CLAUDE.md")
```

---

## Task 3: Final Verification — Entire Refactor

This is the capstone verification for all five phases.

- [ ] **Step 1: Full test suite**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 2: Component tests**

```bash
bun run test:ct
```

Expected: all component tests pass.

- [ ] **Step 3: Type check**

```bash
bun run check:types
```

Expected: zero errors.

- [ ] **Step 4: Lint check**

```bash
bun run check:lint
```

Expected: zero errors.

- [ ] **Step 5: Format check**

```bash
bun run check:format
```

Expected: clean.

- [ ] **Step 6: Docker build test**

```bash
bun run test:docker
```

Expected: Docker image builds and is removed successfully.

- [ ] **Step 7: Check Next.js DevTools for errors**

Use `get_errors` via Next.js DevTools MCP. Expected: no new regressions.

- [ ] **Step 8: Create final summary commit**

```bash
git add -A
git status  # verify nothing unexpected
git commit -m "chore: complete full codebase refactor and audit (Phases D→C→A→B→E)" --allow-empty
```

---

**All phases complete.**

The codebase now has:
- ✅ Comprehensive test suite (unit, integration, component, E2E, docker, smoke)
- ✅ Gated CI: docker build only runs after all tests pass
- ✅ Bun config, Next.js config, and TypeScript hardened
- ✅ Arrow function convention enforced codebase-wide
- ✅ `use cache` consistent across all data files
- ✅ RSC boundaries correct, minimal `use client` surface
- ✅ ESLint clean — all warnings promoted to errors and fixed
- ✅ BaseUI Select rewritten with proper primitives
- ✅ A11y and visual polish applied
- ✅ AGENTS.md enforces these standards for all future work
