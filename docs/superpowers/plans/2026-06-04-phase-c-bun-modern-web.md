# Phase C: Bun & Modern Web Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Bun config, Next.js config, TypeScript config, and ESLint rules; replace Node.js APIs with Bun equivalents where available; audit and update dependencies.

**Architecture:** Config-only changes and targeted source file edits. No new abstractions. All changes must leave the test suite green.

**Tech Stack:** Bun 1.x, Next.js 16, TypeScript 5, ESLint 9

**Prerequisites:** Phase D complete and all tests passing.

---

## Task 1: bunfig.toml — Add Install Freeze and Fix CT Exclusion

**Files:**
- Modify: `bunfig.toml`

- [ ] **Step 1: Update bunfig.toml**

Replace the full contents of `bunfig.toml`:
```toml
[install]
frozen = true

[test]
preload = ["./tests/setup.ts"]
exclude = ["**/*.playwright.ts", "**/*.playwright.tsx"]

[run]
bun = true
```

- [ ] **Step 2: Verify bun test still works**

```bash
bun test
```

Expected: same test results as before.

- [ ] **Step 3: Commit**

```bash
git add bunfig.toml
git commit -m "config: add frozen install and fix CT exclusion in bunfig.toml"
```

---

## Task 2: next.config.ts — Security and Strict Mode

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add poweredByHeader and reactStrictMode**

In `next.config.ts`, update the `nextConfig` object to add two fields at the top level:

```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
  cacheComponents: true,
  reactCompiler: true,
  // ... rest unchanged
}
```

- [ ] **Step 2: Verify type check passes**

```bash
bun run check:types
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "config: disable X-Powered-By header and enable React strict mode"
```

---

## Task 3: TypeScript — Bump Target and Strictness

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Update TypeScript compiler options**

In `tsconfig.json`, change `"target"` and add `"exactOptionalPropertyTypes"`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "exactOptionalPropertyTypes": true,
    // ... all other options unchanged
  }
}
```

- [ ] **Step 2: Run type check to catch any new errors from exactOptionalPropertyTypes**

```bash
bun run check:types 2>&1 | grep -c "error TS" || echo "0 errors"
```

If new errors appear, they will be fixed in Phase A (A5 — ESLint/TS cleanup). Note count here and continue.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: bump TypeScript target to ES2022, add exactOptionalPropertyTypes"
```

---

## Task 4: Add lint:fix Script to package.json

**Files:**
- Modify: `package.json`

Note: This may already be done in Phase D Task 4. Check first.

- [ ] **Step 1: Verify lint:fix exists**

```bash
grep "lint:fix" package.json
```

If present, skip to Step 3. If not:

- [ ] **Step 2: Add the script**

In `package.json`, add to the `"scripts"` section:
```json
"lint:fix": "eslint --fix"
```

- [ ] **Step 3: Test it runs**

```bash
bun run lint:fix
```

Expected: exits 0 (may fix some files or do nothing).

- [ ] **Step 4: Commit if changed**

```bash
git diff --quiet package.json || git add package.json && git commit -m "config: add lint:fix script"
```

---

## Task 5: Bun API Audit — Replace Node.js APIs in Scripts

**Files:**
- Modify: `src/scripts/seed.ts` (if applicable)
- Modify: `src/scripts/reset.ts` (if applicable)
- Modify: `src/scripts/seed-members.ts` (if applicable)
- Modify: `src/lib/utils/user.ts` (if applicable)

- [ ] **Step 1: Find Node.js fs API usage in scripts**

```bash
grep -r "readFileSync\|writeFileSync\|existsSync\|readFile\b" src/scripts src/lib --include="*.ts" -n
```

- [ ] **Step 2: For each `readFileSync(path, 'utf-8')` found in scripts (not test utils), replace with Bun.file**

Pattern to replace:
```ts
// Before:
import { readFileSync } from 'node:fs'
const content = readFileSync(filePath, 'utf-8')

// After:
const content = await Bun.file(filePath).text()
```

Note: `src/lib/utils/user.ts` intentionally uses `readFileSync` + `existsSync` for synchronous dictionary loading — leave it as-is. Only replace in top-level async scripts.

- [ ] **Step 3: Verify scripts still work**

```bash
bun run check:types
```

Expected: zero errors.

- [ ] **Step 4: Commit if any changes were made**

```bash
git diff --quiet || (git add src/scripts/ src/lib/ && git commit -m "perf: replace Node.js fs APIs with Bun.file in scripts")
```

---

## Task 6: Dependency Audit

**Files:**
- Possibly modify: `package.json`, `bun.lock`

- [ ] **Step 1: Check for outdated packages**

```bash
bun outdated
```

Review output. Do NOT update packages that have major version bumps without checking changelogs. This task only covers safe minor/patch updates.

- [ ] **Step 2: Update safe minor/patch packages**

For each package where only minor/patch version is available:
```bash
bun update <package-name>
```

- [ ] **Step 3: Run tests to verify nothing broke**

```bash
bun test && bun run check:types
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: update dependencies to latest minor/patch versions"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Full test suite**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 2: Type check**

```bash
bun run check:types
```

Expected: zero errors (or same count as after Task 3 Step 2 — not increased).

- [ ] **Step 3: Lint check**

```bash
bun run check:lint
```

Expected: no new errors introduced by Phase C changes.

- [ ] **Step 4: Format check**

```bash
bun run check:format
```

Expected: clean.

- [ ] **Step 5: Final commit**

```bash
git add -A
git status  # verify nothing unexpected
git commit -m "chore: complete Phase C — Bun and modern web optimizations" --allow-empty
```

---

**Phase C complete.** Configs hardened, Bun APIs used where applicable, dependencies updated.

Proceed to Phase A plan: `docs/superpowers/plans/2026-06-04-phase-a-core-refactor.md`
