# Testing Infrastructure & Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive testing infrastructure using Bun, Happy DOM, and Playwright, following the Balanced Testing Pyramid strategy.

**Architecture:** Utilize Bun's native test runner with Happy DOM for fast unit and component tests, and Playwright for end-to-end flows. Tests are colocated with source files for maintainability.

**Tech Stack:** Bun, Happy DOM, @testing-library/react, Playwright, GitHub Actions.

---

### Task 1: Setup Testing Infrastructure (Bun + Happy DOM)

**Files:**
- Modify: `tests/setup.ts`
- Modify: `bunfig.toml`

- [ ] **Step 1: Replace JSDOM with Happy DOM in setup.ts**
Update `tests/setup.ts` to use `@happy-dom/global-registrator` and add `jest-dom` matchers.

```typescript
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'bun:test';

// Register Happy DOM
GlobalRegistrator.register();

// Extend Bun's expect with jest-dom matchers
expect.extend(matchers);
```

- [ ] **Step 2: Update bunfig.toml**
Ensure `bunfig.toml` preloads the setup file and has correct test settings.

```toml
[test]
setupFiles = ["tests/setup.ts"]
exclude = ["**/*.playwright.ts"] # Exclude Playwright tests from bun test
```

- [ ] **Step 3: Verify infrastructure with a dummy test**
Create `tests/infra.test.ts`.

```typescript
import { expect, test } from "bun:test";

test("DOM is available via Happy DOM", () => {
  document.body.innerHTML = '<div id="test">Hello</div>';
  const element = document.getElementById("test");
  expect(element?.textContent).toBe("Hello");
});
```

- [ ] **Step 4: Run the test**
Run: `bun test tests/infra.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add tests/setup.ts bunfig.toml tests/infra.test.ts
git commit -m "chore: setup happy-dom and bun test infrastructure"
```

### Task 2: Unit Testing for Utilities

**Files:**
- Create: `src/lib/utils/user.test.ts`

- [ ] **Step 1: Write failing test for user utils**
Test `getRandomAlphanumeric` and `generatePassword`.

```typescript
import { expect, test, describe } from "bun:test";
import { getRandomAlphanumeric, generatePassword } from "./user";

describe("User Utils", () => {
  test("getRandomAlphanumeric returns correct length", () => {
    const res = getRandomAlphanumeric(10);
    expect(res).toHaveLength(10);
    expect(res).toMatch(/^[a-z0-9]+$/);
  });

  test("generatePassword follows pattern [word]-[random]", () => {
    // Note: ensure dictionary.txt exists or mock it
    const password = generatePassword();
    expect(password).toMatch(/^[a-zA-Z]+-[a-z0-9]{5}$/);
  });
});
```

- [ ] **Step 2: Run test to verify**
Run: `bun test src/lib/utils/user.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/lib/utils/user.test.ts
git commit -m "test: add unit tests for user utilities"
```

### Task 3: Component Testing (UI Atoms)

**Files:**
- Create: `src/components/shadcn/ui/button.test.tsx`

- [ ] **Step 1: Write component test for Button**
Test rendering and interaction.

```tsx
import { expect, test, describe, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button Component", () => {
  test("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("handles click events", () => {
    const onClick = mock(() => {});
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toBeCalled();
  });
});
```

- [ ] **Step 2: Run component tests**
Run: `bun test src/components/shadcn/ui/button.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/components/shadcn/ui/button.test.tsx
git commit -m "test: add component tests for UI button"
```

### Task 4: CI/CD Pipeline Setup

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Implement CI workflow**
Add linting, formatting check, unit tests, and E2E tests.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Check format
        run: bun run check:format
      - name: Lint
        run: bun run check:lint
      - name: Run Unit Tests
        run: bun test
      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps
      - name: Run E2E Tests
        run: bun run test:e2e
```

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add github actions workflow for tests and linting"
```

### Task 5: Final Verification & Cleanup

- [ ] **Step 1: Run all tests locally**
Run: `bun test && bun run test:e2e`
Expected: ALL PASS

- [ ] **Step 2: Remove dummy infra test**
Remove `tests/infra.test.ts`.

- [ ] **Step 3: Final Commit**
```bash
rm tests/infra.test.ts
git add .
git commit -m "chore: final testing infrastructure cleanup"
```
