# Testing Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a complete, automated testing pipeline (Unit, Component, E2E) using Bun and Playwright, integrated into GitHub Actions.

**Architecture:** Colocated unit/component tests for fast feedback, centralized E2E tests for flow validation, and a strict CI gate.

**Tech Stack:** Bun, happy-dom, @testing-library/react, Playwright, GitHub Actions.

---

### Task 1: Verify Core Setup (Research & Verification)

**Files:**
- Verify: `package.json`
- Verify: `bunfig.toml`
- Verify: `tests/setup.ts`

- [ ] **Step 1: Check existing scripts**

Run: `cat package.json`
Ensure `test`, `test:e2e`, and `test:ct` scripts exist.

- [ ] **Step 2: Verify Bun test environment**

Run: `cat bunfig.toml`
Ensure it points to `tests/setup.ts`.

- [ ] **Step 3: Verify Test Setup**

Run: `cat tests/setup.ts`
Ensure `happy-dom` is installed and configured.

### Task 2: Unit Test Pattern (src/lib/shadcn)

**Files:**
- Create: `src/lib/shadcn/utils.test.ts`

- [ ] **Step 1: Write a unit test for `cn` utility**

Create `src/lib/shadcn/utils.test.ts`:
```ts
import { describe, it, expect } from "bun:test";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toContain("px-4");
    expect(result).toContain("py-1");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toContain("active-class");
  });
});
```

- [ ] **Step 2: Run the test**

Run: `bun test src/lib/shadcn/utils.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/shadcn/utils.test.ts
git commit -m "test: implement unit test pattern for shadcn utils"
```

### Task 3: Component Test Pattern (Bun Test + JSDOM)

**Files:**
- Modify: `src/components/shadcn/ui/button/button.spec.tsx`

- [ ] **Step 1: Fix Button component test**

Modify `src/components/shadcn/ui/button/button.spec.tsx` to use locators correctly:
```tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './button';

test('should render the children text', async ({ mount }) => {
  const component = mount(<Button>Click Me</Button>);
  await expect(component).toBeVisible();
  await expect(component).toHaveText('Click Me');
});

test('should apply correct styles based on variant prop', async ({ mount }) => {
  const component = mount(<Button variant="destructive">Delete</Button>);
  await expect(component).toHaveClass(/bg-destructive/);
});
```

- [ ] **Step 2: Run the test**

Run: `bun test --preload ./tests/setup.ts src/components/shadcn/ui/button/button.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/shadcn/ui/button/button.spec.tsx
git commit -m "test: fix component test locators for button"
```

### Task 4: E2E Baseline Test (Playwright)

**Files:**
- Create: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Create a baseline E2E test for the home page**

Create `tests/e2e/auth.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/KAMMI.id/);
});
```

- [ ] **Step 2: Run E2E test (requires dev server)**

Ensure dev server is running (`bun run dev`).
Run test: `bun run test:e2e`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth.spec.ts
git commit -m "test: implement baseline E2E test"
```

### Task 5: CI/CD Pipeline Setup

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
    branches: [main, dev-*]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Check Formatting
        run: bun run check:format

      - name: Check Linting
        run: bun run check:lint

      - name: Run Unit Tests
        run: bun test

      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps

      - name: Run E2E Tests
        run: |
          bun run dev &
          npx wait-on http://localhost:3000
          bun run test:e2e
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: setup github actions for testing pipeline"
```
