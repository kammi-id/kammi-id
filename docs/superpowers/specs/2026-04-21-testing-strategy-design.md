# Testing Strategy Design: Balanced Safety Net

**Date:** 2026-04-21
**Status:** Proposed
**Strategy:** Balanced Testing Pyramid (Option 2)

## 1. Executive Summary
Implement a comprehensive testing infrastructure using Bun's native test runner and Playwright to ensure stability as the project grows in complexity. The strategy prioritizes critical business logic and user flows while maintaining a fast developer experience through colocation and efficient tooling.

## 2. Infrastructure & Tooling

### 2.1 Tool Stack
- **Test Runner:** `bun test` (Primary runner for unit and component tests).
- **DOM Simulation:** `happy-dom` (Lightweight browser environment for Bun).
- **Component Testing:** `@testing-library/react` & `@testing-library/user-event`.
- **E2E Testing:** `Playwright` (Cross-browser end-to-end validation).
- **CI/CD:** GitHub Actions (Automated gatekeeping for PRs to `main`).

### 2.2 Folder Structure & Colocation
Adhering to the **Ultra-Atomic** and **Colocation** principles defined in `AGENTS.md`:
- **Unit & Component Tests:** Placed alongside the source file within the same folder.
  - Pattern: `src/**/[component-name].test.{ts,tsx}`.
- **E2E Tests:** Centralized in `/tests/e2e/` due to their cross-cutting nature.
- **Infrastructure Config:** `bunfig.toml` for test configuration.

### 2.3 CI/CD Pipeline
A GitHub Workflow `.github/workflows/ci.yml` will be implemented to run on every Pull Request:
1. **Environment Setup:** Bun installation and dependency caching.
2. **Static Analysis:** `check:format` (Prettier) and `check:lint` (ESLint).
3. **Automated Tests:**
    - Execution of `bun test` for all unit and component tests.
    - Execution of `bun run test:e2e` using Playwright's headless mode.
4. **Merge Gate:** PRs cannot be merged unless all tests pass.

## 3. Unit & Integration Testing Strategy

### 3.1 `src/lib` (Utility Logic)
- **Scope:** Pure functions and helper utilities.
- **Approach:** Pure Unit Testing.
- **Priority:** Edge cases, input validation, and consistent output for complex transformations.

### 3.2 `action.ts` (Server Actions)
- **Scope:** Data mutations, Zod validation, and business logic.
- **Approach:** Integration Testing.
- **Priority:**
    - Zod schema validation (rejecting invalid input).
    - Business rule enforcement (e.g., preventing duplicate members).
    - Success/Error response handling.

### 3.3 `data.ts` (Data Fetching)
- **Scope:** Server-side data retrieval and caching.
- **Approach:** Integration Testing.
- **Priority:**
    - Correct query execution.
    - Validation of `cacheTag` and `cacheLife` implementation.
    - Graceful handling of `notFound()` and database errors.

## 4. Component Testing Strategy

### 4.1 Reusable Components (`src/components/`)
- **Scope:** Global UI atoms and molecules.
- **Approach:** Rigorous Component Testing.
- **Priority:** Prop variants, A11y compliance, and basic interaction handlers.

### 4.2 Page-Specific Components (`src/app/**/_components/`)
- **Scope:** Feature-specific UI logic.
- **Approach:** Behavioral Testing.
- **Priority:**
    - User flow (e.g., "Input $\rightarrow$ Submit $\rightarrow$ Loading $\rightarrow$ Success").
    - Reaction to Server Action responses (Mocked actions).
    - State transitions (Loading, Error, Empty states).

## 5. E2E Testing Strategy

### 5.1 Critical User Journeys (CUJs)
Focus on "Golden Paths" that represent core application value:
- **Member Management:** Full lifecycle (Create $\rightarrow$ Read $\rightarrow$ Update $\rightarrow$ Delete).
- **Authentication:** Login $\rightarrow$ Dashboard navigation $\rightarrow$ Logout.
- **Data Persistence:** Verifying that UI changes are reflected in the database and survive page refreshes.

### 5.2 Data & State Management
- **Seeding:** Use `src/scripts/seed.ts` to establish a known baseline before tests.
- **Isolation:** Use unique identifiers for test data to prevent collisions during parallel execution.
- **Cleanup:** Reset database state between critical test suites.

## 6. Testing Matrix Summary

| Layer | Tool | Target | Focus | Speed |
| :--- | :--- | :--- | :--- | :--- |
| **Unit** | `bun test` | `src/lib`, `action.ts` | Logic & Edge Cases | Fast |
| **Component** | `testing-library` | `src/components`, `_components` | User Interaction & A11y | Medium |
| **E2E** | `Playwright` | Whole App | Critical User Flows | Slow |
