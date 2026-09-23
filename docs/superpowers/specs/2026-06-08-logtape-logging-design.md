# LogTape production logging — design

## Goal

Set up `@logtape/logtape` (already in `package.json`, unused so far) so that errors
and critical operations in production are logged to stdout/stderr in a
human-readable format, readable through Dokploy's container log viewer.

## File layout

```
src/instrumentation.ts          # Next.js convention file — register() + onRequestError
src/lib/logger/
  ├── index.ts                  # barrel: re-exports getLogger, redact
  ├── config.ts                 # configure() call: sinks, formatter, severity per category
  └── redact.ts                 # redact() helper for sensitive fields
```

- `instrumentation.ts` exports `register()`, called once when the Next.js server
  boots (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`).
  It calls `configure()` from `lib/logger/config.ts`.
- `instrumentation.ts` also exports `onRequestError` (`Instrumentation.onRequestError`)
  as a safety net that logs **uncaught** server errors (RSC render crashes,
  unhandled action throws) — on top of, not instead of, manual logging in actions.

## Logger configuration (`lib/logger/config.ts`)

- Sink: `getConsoleSink()` with a custom `getTextFormatter({...})` producing plain,
  human-readable text with **no ANSI color codes** (Dokploy's web log viewer would
  render escape sequences as garbage). Format roughly:
  `[2026-06-08 15:30:00] ERROR app·action·organization: Gagal membuat organisasi error=Error: ...`
- `getConsoleSink()` naturally routes by level (`console.error` for error/fatal,
  `console.warn` for warning, `console.info`/`console.log` otherwise) — Docker
  captures both stdout and stderr, both visible in Dokploy.
- Root category `["app"]`, lowest level `"info"` in production / `"debug"` in
  development, switched on `process.env.NODE_ENV`.
- Meta category `["logtape", "meta"]` set to `"warning"` to silence LogTape's own
  startup messages.

## Category convention

Hierarchical category arrays mirroring the feature structure, so logs can be
filtered by area in Dokploy:

- `["app", "action", "<feature>"]` — e.g. `["app", "action", "organization"]`,
  `["app", "action", "auth"]`
- `["app", "db", "<table>"]` — for `db/query/*.ts`
- `["app", "storage"]` — for `lib/api/storage.ts` and `lib/actions/storage.ts`

Each module creates its logger once at module scope via
`getLogger(["app", "action", "organization"])`.

## Redaction (`lib/logger/redact.ts`)

`redact(value: unknown): unknown` recursively walks plain objects/arrays and
replaces any value whose key matches `/password|token|secret|session|credential/i`
with `'[REDACTED]'`. Used whenever logging payloads that may carry credentials
(form data, session objects, etc.) so secrets never reach stdout.

## Migration scope

**Migrated** — server-side code whose output reaches Dokploy:

- All 15 existing `action.ts` files (`console.error` → `logger.error`)
- `src/lib/api/storage.ts`, `src/lib/actions/storage.ts`
- `src/db/query/*.ts` where bare throws are worth logging

**Not migrated** (logs wouldn't reach Dokploy, or out of scope):

- Client components (`individual-table.tsx`, `member-search-combobox.tsx`,
  `image-upload.tsx`, etc.) — these `console.error` calls run in the browser.
- Dev/CLI scripts (`src/scripts/*`, `src/db/scripts/*`) — one-off tooling, not
  production runtime.

## Audit trail (info-level)

Add `logger.info(...)` after critical mutations succeed (currently unlogged on
the happy path), each entry including actor (`{ actorId, actorRole }`, redacted)
and target id:

- Organization: create / update / delete
- Member: create / update / bulk-upload
- Training: create / update
- User account: profile/credential changes
- Auth: login success/failure, logout

Example: `logger.info('Organisasi dibuat', { actorId, organizationId })`.

## Error logging pattern

Replace:

```ts
} catch (error) {
  console.error('Error creating organization:', error)
  return { success: false, message: '...' }
}
```

with:

```ts
} catch (error) {
  logger.error('Gagal membuat organisasi: {error}', { error })
  return { success: false, message: '...' }
}
```

LogTape's brace-placeholder syntax (`{error}`) keeps the message template and
structured properties together, both rendered by the text formatter.
