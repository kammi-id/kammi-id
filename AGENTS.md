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
- **Generics exception:** Generic components in `.tsx` **may** use function declarations, because generic arrow syntax needs a parser workaround (`<T,>` or `extends unknown`) that is uglier than the problem it solves. Reference: `DataTable<TData, TValue>` in `dashboard/_components/data-table/`.
- **Generated-code exception:** The arrow rule does not apply to `src/components/shadcn/`, `src/lib/shadcn/`, or any file outside `src/`.
- **Route convention files are not exempt.** `page.tsx`, `layout.tsx`, `loading.tsx` and friends follow the arrow rule like everything else. Their exemption (see *Organization Exceptions*) covers structure and colocation only.

# Codebase Organization

## Scope

These rules govern **component code**: `src/app/**/_components/` and `src/components/`.

They are **not** dashboard-scoped. The `(main)` route group measured as the most compliant area in the codebase, and scoping the rules to the dashboard would license the cleanest code to drift.

`src/lib/` is **out of scope** and keeps its own flat, per-domain, barrel-free convention.

## General Principles

- **Colocation:** Components live near the route that uses them (inside a `_components/` folder), or in `src/components/` if they clear the promotion bar below.
- **A folder is an exported unit.** A component folder is one unit exported through its barrel. Sibling files are legitimate as long as they are consumed only by their sibling parent. The moment a file is imported from *outside* its folder, it graduates to its own folder with its own barrel.
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

Enforced by the restricted-import patterns in `eslint.config.mjs`. The rule bans deep relative component imports outright — including a route deep-importing its *own* folder, which is not harmful in itself. A pattern matcher cannot tell a route's own directory from another's, and the strict form keeps the rule a one-liner.

## Ownership

**Promotion bar — generic AND used by two or more routes.** Both conditions, not either. "Two or more routes" alone would promote a route-shaped composite; "generic" alone grows `src/components/` ahead of demand.

**Owning route + sanctioned consumers.** Shared code may deliberately stay inside its **owning route**'s `_components/` when it is too route-shaped to promote. Other routes are then **sanctioned consumers**: they import through the folder barrel and nothing else. Ownership stays with the route; consumers acquire no say over its shape.

Reference: `members-page-content` is owned by `kader` and consumed by `alumni` and `perangkat`.

## Authorization

Shared **authorization** logic lives in `src/lib/auth/` and is never duplicated across route-level action files. `readActiveSession` is the only sanctioned way to read a session.

Name a shared gate for the **privilege it grants**, not for the act of checking — a generic name invites reuse for a check that is merely authentication. Reference: `requireSiteSettingsAccess` in `src/lib/auth/site-settings.ts`.

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

> A companion file may sit at a `_components/` root **only if it is free of side effects** — types and constants only; no `'use server'`, no session read, no DB access. Prefix it `_`. Anything that *does* something belongs to a component folder.

This is why a root-level `action.ts` is a violation while `articles/_components/_constants.ts` is not.

## Filenames

- **kebab-case**, always.
- **No `index` implementation files** — the implementation is `<folder-name>.tsx`; `index.ts` is a barrel only.
- **Sibling names are domain-specific, not role-generic.** A name stating only its role (`form`, `card`, `list`, `item`, `content`, `wrapper`) takes its parent component's name as a prefix.
- **Sanctioned idioms:** `columns.tsx` (TanStack column definitions) and `*-client.tsx` (the RSC/client boundary).
- React component identifiers stay **PascalCase**. Only the *filename* convention is at issue.

## Engineering Standards (Ultra-Atomic)

- **Composition:** Use Compound Components pattern for reusable components to avoid prop-drilling and maximize flexibility.
- **RSC-First:** Keep `'use client'` at the leaf-component level to maximize Server Component usage.
- **Caching:** Implement granular cache invalidation using `cacheTag` in `data.ts` and `updateTag` in `action.ts`.
- **A11y:** All components must follow Web Interface Guidelines (semantic HTML, aria-labels, keyboard navigation).
- **Performance:** Use `useOptimistic` and `useTransition` for seamless data mutations.

## Organization Exceptions

Each exemption states **which rules** it covers. An exemption not listed here does not exist.

| Exempt | From | Not from |
| --- | --- | --- |
| `src/components/shadcn/`, `src/lib/shadcn/` (CLI-generated) | Everything in this section, plus the arrow-function rule | — |
| Next.js convention files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`) | Atomic structure and colocation | **The arrow-function rule**, which still applies |
| Grouping folders (content-defined, see *Barrels*) | Needing a barrel | The naming rules |
| `_`-prefixed side-effect-free files at a `_components/` root | The bare-file rule and kebab-case | Being side-effect-free |

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

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./node_modules/next/dist/docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.md}|01-app/01-getting-started:{01-installation.md,02-project-structure.md,03-layouts-and-pages.md,04-linking-and-navigating.md,05-server-and-client-components.md,06-fetching-data.md,07-mutating-data.md,08-caching.md,09-revalidating.md,10-error-handling.md,11-css.md,12-images.md,13-fonts.md,14-metadata-and-og-images.md,15-route-handlers.md,16-proxy.md,17-deploying.md,18-upgrading.md}|01-app/02-guides:{ai-agents.md,analytics.md,authentication.md,backend-for-frontend.md,caching-without-cache-components.md,cdn-caching.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,data-security.md,debugging.md,deploying-to-platforms.md,draft-mode.md,environment-variables.md,forms.md,how-revalidation-works.md,incremental-static-regeneration.md,instant-navigation.md,instrumentation.md,internationalization.md,json-ld.md,lazy-loading.md,local-development.md,mcp.md,mdx.md,memory-usage.md,migrating-to-cache-components.md,multi-tenant.md,multi-zones.md,open-telemetry.md,package-bundling.md,ppr-platform-guide.md,prefetching.md,preserving-ui-state.md,production-checklist.md,progressive-web-apps.md,public-static-pages.md,redirecting.md,rendering-philosophy.md,sass.md,scripts.md,self-hosting.md,single-page-applications.md,static-exports.md,streaming.md,tailwind-v3-css.md,third-party-libraries.md,videos.md}|01-app/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|01-app/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|01-app/02-guides/upgrading:{codemods.md,version-14.md,version-15.md,version-16.md}|01-app/03-api-reference:{07-edge.md,08-turbopack.md}|01-app/03-api-reference/01-directives:{use-cache-private.md,use-cache-remote.md,use-cache.md,use-client.md,use-server.md}|01-app/03-api-reference/02-components:{font.md,form.md,image.md,link.md,script.md}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.md,manifest.md,opengraph-image.md,robots.md,sitemap.md}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.md,instant.md,maxDuration.md,preferredRegion.md,runtime.md}|01-app/03-api-reference/03-file-conventions:{default.md,dynamic-routes.md,error.md,forbidden.md,instrumentation-client.md,instrumentation.md,intercepting-routes.md,layout.md,loading.md,mdx-components.md,not-found.md,page.md,parallel-routes.md,proxy.md,public-folder.md,route-groups.md,route.md,src-folder.md,template.md,unauthorized.md}|01-app/03-api-reference/04-functions:{after.md,cacheLife.md,cacheTag.md,catchError.md,connection.md,cookies.md,draft-mode.md,fetch.md,forbidden.md,generate-image-metadata.md,generate-metadata.md,generate-sitemaps.md,generate-static-params.md,generate-viewport.md,headers.md,image-response.md,next-request.md,next-response.md,not-found.md,permanentRedirect.md,redirect.md,refresh.md,revalidatePath.md,revalidateTag.md,unauthorized.md,unstable_cache.md,unstable_noStore.md,unstable_rethrow.md,updateTag.md,use-link-status.md,use-params.md,use-pathname.md,use-report-web-vitals.md,use-router.md,use-search-params.md,use-selected-layout-segment.md,use-selected-layout-segments.md,userAgent.md}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,appDir.md,assetPrefix.md,authInterrupts.md,basePath.md,cacheComponents.md,cacheHandlers.md,cacheLife.md,compress.md,crossOrigin.md,cssChunking.md,deploymentId.md,devIndicators.md,distDir.md,env.md,expireTime.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,htmlLimitedBots.md,httpAgentOptions.md,images.md,incrementalCacheHandlerPath.md,inlineCss.md,logging.md,mdxRs.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactCompiler.md,reactMaxHeadersLength.md,reactStrictMode.md,redirects.md,rewrites.md,sassOptions.md,serverActions.md,serverComponentsHmrCache.md,serverExternalPackages.md,staleTimes.md,staticGeneration.md,taint.md,trailingSlash.md,transpilePackages.md,turbopack.md,turbopackFileSystemCache.md,turbopackIgnoreIssue.md,typedRoutes.md,typescript.md,urlImports.md,useLightningcss.md,viewTransition.md,webVitalsAttribution.md,webpack.md}|01-app/03-api-reference/05-config:{02-typescript.md,03-eslint.md}|01-app/03-api-reference/06-cli:{create-next-app.md,next.md}|01-app/03-api-reference/07-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|02-pages/01-getting-started:{01-installation.md,02-project-structure.md,04-images.md,05-fonts.md,06-css.md,11-deploying.md}|02-pages/02-guides:{analytics.md,authentication.md,babel.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,debugging.md,draft-mode.md,environment-variables.md,forms.md,incremental-static-regeneration.md,instrumentation.md,internationalization.md,lazy-loading.md,mdx.md,multi-zones.md,open-telemetry.md,package-bundling.md,post-css.md,preview-mode.md,production-checklist.md,redirecting.md,sass.md,scripts.md,self-hosting.md,static-exports.md,tailwind-v3-css.md,third-party-libraries.md}|02-pages/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|02-pages/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|02-pages/02-guides/upgrading:{codemods.md,version-10.md,version-11.md,version-12.md,version-13.md,version-14.md,version-9.md}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.md,02-dynamic-routes.md,03-linking-and-navigating.md,05-custom-app.md,06-custom-document.md,07-api-routes.md,08-custom-error.md}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.md,02-static-site-generation.md,04-automatic-static-optimization.md,05-client-side-rendering.md}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.md,02-get-static-paths.md,03-forms-and-mutations.md,03-get-server-side-props.md,05-client-side.md}|02-pages/03-building-your-application/06-configuring:{12-error-handling.md}|02-pages/04-api-reference:{06-edge.md,08-turbopack.md}|02-pages/04-api-reference/01-components:{font.md,form.md,head.md,image-legacy.md,image.md,link.md,script.md}|02-pages/04-api-reference/02-file-conventions:{instrumentation.md,proxy.md,public-folder.md,src-folder.md}|02-pages/04-api-reference/03-functions:{get-initial-props.md,get-server-side-props.md,get-static-paths.md,get-static-props.md,next-request.md,next-response.md,use-params.md,use-report-web-vitals.md,use-router.md,use-search-params.md,userAgent.md}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,assetPrefix.md,basePath.md,bundlePagesRouterDependencies.md,compress.md,crossOrigin.md,deploymentId.md,devIndicators.md,distDir.md,env.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,httpAgentOptions.md,images.md,logging.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactStrictMode.md,redirects.md,rewrites.md,serverExternalPackages.md,trailingSlash.md,transpilePackages.md,turbopack.md,typescript.md,urlImports.md,useLightningcss.md,webVitalsAttribution.md,webpack.md}|02-pages/04-api-reference/04-config:{01-typescript.md,02-eslint.md}|02-pages/04-api-reference/05-cli:{create-next-app.md,next.md}|02-pages/04-api-reference/06-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|03-architecture:{accessibility.md,fast-refresh.md,nextjs-compiler.md,supported-browsers.md}|04-community:{01-contribution-guide.md,02-rspack.md}<!-- NEXT-AGENTS-MD-END -->

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
