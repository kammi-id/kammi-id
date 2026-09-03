<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
- **Generics exception:** Generic components in `.tsx` **may** use function declarations, because generic arrow syntax needs a parser workaround (`<T,>` or `extends unknown`) that is uglier than the problem it solves. Reference: `DataTable<TData, TValue>` in `dashboard/_components/data-table/`.
- **Generated-code exception:** The arrow rule does not apply to `src/components/shadcn/`, `src/lib/shadcn/`, or any file outside `src/`.
- **Route convention files are not exempt.** `page.tsx`, `layout.tsx`, `loading.tsx` and friends follow the arrow rule like everything else. Their exemption (see _Organization Exceptions_) covers structure and colocation only.

# Codebase Organization

## Scope

These rules govern **component code**: `src/app/**/_components/` and `src/components/`.

They are **not** dashboard-scoped. The `(main)` route group measured as the most compliant area in the codebase, and scoping the rules to the dashboard would license the cleanest code to drift.

`src/lib/` is **out of scope** and keeps its own flat, per-domain, barrel-free convention.

## General Principles

- **Colocation:** Components live near the route that uses them (inside a `_components/` folder), or in `src/components/` if they clear the promotion bar below.
- **A folder is an exported unit.** A component folder is one unit exported through its barrel. Sibling files are legitimate as long as they are consumed only by their sibling parent. The moment a file is imported from _outside_ its folder, it graduates to its own folder with its own barrel.
- **Named-File Atomic Pattern:**
  - The implementation file is named for its folder (e.g., `my-component/my-component.tsx`).
  - `index.ts` is a barrel and nothing else (`export * from './my-component'`).

> **Note:** "A folder is an exported unit" replaces the former rule "one component or function per folder". That rule read as one implementation file per folder, which the reference implementation never obeyed — `training-detail-view/` and `branches-grid/` are each a single component with internal parts. Multi-file folders of that shape are correct and are not to be split.

## Barrels

Required on **every folder that directly contains a component file**.

**Grouping folders are exempt** — a folder holding only other component folders is not an exported unit and needs no barrel. This is defined by **content, not name**, so it stays true as the tree grows. Current instances: `src/components/`, `src/components/ui/`, `src/components/base-ui/`.

Do not add barrels to grouping folders. A registry someone has to remember to update is the barrel most likely to rot silently, and the import rule below does not depend on it.

## Cross-route imports

> An import violates if its path enters a component directory it does not own **and** points deeper than a direct child of that directory. Relative paths and the `~/` alias are the same violation in two spellings.

```
✗ ~/app/(dashboard)/dashboard/kader/_components/add-form/action
✗ ../../kader/_components/members-page-header/members-page-header
✓ ~/app/(dashboard)/dashboard/kader/_components/add-form
```

Both spellings are named deliberately: three of five reach-ins once escaped an audit because only relative paths were searched.

Enforced by the restricted-import patterns in `eslint.config.mjs`. The rule bans deep relative component imports outright — including a route deep-importing its _own_ folder, which is not harmful in itself. A pattern matcher cannot tell a route's own directory from another's, and the strict form keeps the rule a one-liner.

## Ownership

**Promotion bar — generic AND used by two or more routes.** Both conditions, not either. "Two or more routes" alone would promote a route-shaped composite; "generic" alone grows `src/components/` ahead of demand.

**Owning route + sanctioned consumers.** Shared code may deliberately stay inside its **owning route**'s `_components/` when it is too route-shaped to promote. Other routes are then **sanctioned consumers**: they import through the folder barrel and nothing else. Ownership stays with the route; consumers acquire no say over its shape.

Reference: `members-page-content` is owned by `kader` and consumed by `alumni` and `perangkat`.

## Authorization

Shared **authorization** logic lives in `src/lib/auth/` and is never duplicated across route-level action files. `readActiveSession` is the only sanctioned way to read a session.

Name a shared gate for the **privilege it grants**, not for the act of checking — a generic name invites reuse for a check that is merely authentication. Reference: `requireSiteSettingsAccess` in `src/lib/auth/site-settings.ts`.

**Cakupan is a required argument, never an optional one.** A scoped read takes `AccessScope` (`src/db/query/organization.ts`) as a **required** parameter, so omitting it is a `tsc` error rather than a silent leak. `readAccessScope` in `src/lib/auth/access-scope.ts` is the only sanctioned way to build one — do not re-derive `{ role, connectedOrganizationId }` from a session at a call site. Reference: `readDescendantMembers` and `readMemberAggregates` in `src/db/query/member.ts`.

## Component Folder Conventions

Each component folder may contain the following supporting files:

- `index.ts`: Barrel file for re-exports.
- `action.ts`: Next.js Server Actions (with Zod validation & Optimistic updates).
- `data.ts`: Server-side data fetching (with 'use cache', cacheLife, cacheTag).
- `schema.ts`: Zod schemas, split from `action.ts` once they earn their own file.
- `store.ts`: Nanostores state management (minimalist, reactive state).
- `types.ts`: Component-specific type definitions.
- `constants.ts`: Static values and configuration.
- `utils.ts`: Local helper functions.
- `*.test.ts`: Test files.

**`_data/` — route-level cached reads.** A `_data/` folder at a route or route-group root holds the `'use cache'` read functions shared by that route's pages. It is the sanctioned home for the `cacheTag` half of the `cacheTag`/`updateTag` pairing; `action.ts` keeps `updateTag`.

### Files at a `_components/` root

> A companion file may sit at a `_components/` root **only if it is free of side effects** — types and constants only; no `'use server'`, no session read, no DB access. Prefix it `_`. Anything that _does_ something belongs to a component folder.

This is why a root-level `action.ts` is a violation while `articles/_components/_constants.ts` is not.

## Filenames

- **kebab-case**, always.
- **No `index` implementation files** — the implementation is `<folder-name>.tsx`; `index.ts` is a barrel only.
- **Sibling names are domain-specific, not role-generic.** A name stating only its role (`form`, `card`, `list`, `item`, `content`, `wrapper`) takes its parent component's name as a prefix.
- **Sanctioned idioms:** `columns.tsx` (TanStack column definitions) and `*-client.tsx` (the RSC/client boundary).
- React component identifiers stay **PascalCase**. Only the _filename_ convention is at issue.

## Engineering Standards (Ultra-Atomic)

- **Composition:** Use Compound Components pattern for reusable components to avoid prop-drilling and maximize flexibility.
- **RSC-First:** Keep `'use client'` at the leaf-component level to maximize Server Component usage.
- **Caching:** Implement granular cache invalidation using `cacheTag` in `data.ts` and `updateTag` in `action.ts`.
- **A11y:** All components must follow Web Interface Guidelines (semantic HTML, aria-labels, keyboard navigation).
- **Performance:** Use `useOptimistic` and `useTransition` for seamless data mutations.

## Organization Exceptions

Each exemption states **which rules** it covers. An exemption not listed here does not exist.

| Exempt                                                                                                       | From                                                     | Not from                                         |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| `src/components/shadcn/`, `src/lib/shadcn/` (CLI-generated)                                                  | Everything in this section, plus the arrow-function rule | —                                                |
| Next.js convention files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`) | Atomic structure and colocation                          | **The arrow-function rule**, which still applies |
| Grouping folders (content-defined, see _Barrels_)                                                            | Needing a barrel                                         | The naming rules                                 |
| `_`-prefixed side-effect-free files at a `_components/` root                                                 | The bare-file rule and kebab-case                        | Being side-effect-free                           |

## Reference implementations

- **`articles`** — folder shape, barrels, `schema.ts`, per-component `action.ts`.
- **`(main)`** — the naming and barrel rules at scale.
- **`kader/_components/members-page-content/`** — owning route + sanctioned consumers.
- **`src/components/image-upload/`** — what clearing the promotion bar looks like.

## Enforcement

- `bun run check:lint` — cross-route imports (restricted-import patterns).
- `bun run check:structure` — barrel presence, implementation-file naming, bare files at a `_components/` root, kebab-case.
- `bun run check:types` — the primary guard for anything structural.

All three run in CI and fail the build.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
