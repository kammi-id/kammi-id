# LogTape Production Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up `@logtape/logtape` so that errors and critical operations are
logged in production as plain, human-readable text on stdout/stderr — readable
through Dokploy's container log viewer — replacing ad-hoc `console.error`/`console.warn`
calls and adding an audit trail for critical mutations.

**Architecture:** A small `src/lib/logger/` module configures LogTape once (via
`src/instrumentation.ts#register`) with a console sink and a plain-text formatter,
exposes `getLogger`/`redact` through a barrel, and is consumed by server actions
and `lib/api`/`lib/actions` modules. `onRequestError` in `instrumentation.ts` is a
safety net that captures uncaught server errors. Existing `console.error`/`console.warn`
in server-side code is replaced with categorized `logger.error` calls, and
`logger.info` calls are added on the happy path of critical mutations (org, member,
training, account, auth) to form an audit trail.

**Tech Stack:** `@logtape/logtape` (already in `package.json`), Next.js 16
instrumentation hooks, Bun test runner (`bun:test`).

**Reference spec:** `docs/superpowers/specs/2026-06-08-logtape-logging-design.md`

---

## Phase 1 — Logger infrastructure

### Task 1: `redact` helper

**Files:**

- Create: `src/lib/logger/redact.ts`
- Test: `src/lib/logger/redact.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/logger/redact.test.ts
import { describe, expect, test } from 'bun:test'
import { redact } from './redact'

describe('redact', () => {
  test('masks top-level keys matching sensitive patterns', () => {
    const input = { username: 'alice', password: 'hunter2', token: 'abc123' }

    expect(redact(input)).toEqual({
      username: 'alice',
      password: '[REDACTED]',
      token: '[REDACTED]'
    })
  })

  test('masks nested sensitive keys recursively', () => {
    const input = {
      user: {
        name: 'alice',
        credentials: { secret: 'shh', sessionToken: 'xyz' }
      }
    }

    expect(redact(input)).toEqual({
      user: {
        name: 'alice',
        credentials: { secret: '[REDACTED]', sessionToken: '[REDACTED]' }
      }
    })
  })

  test('redacts sensitive keys inside arrays of objects', () => {
    const input = [{ password: 'a' }, { name: 'bob' }]

    expect(redact(input)).toEqual([{ password: '[REDACTED]' }, { name: 'bob' }])
  })

  test('passes through primitives and non-sensitive values unchanged', () => {
    expect(redact('hello')).toBe('hello')
    expect(redact(42)).toBe(42)
    expect(redact(null)).toBe(null)
    expect(redact(undefined)).toBe(undefined)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/logger/redact.test.ts`
Expected: FAIL with something like `Cannot find module './redact'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/logger/redact.ts

/**
 * Matches object keys that likely carry sensitive data — these values are
 * masked before being written to logs so credentials never reach stdout.
 */
const SENSITIVE_KEY_PATTERN = /password|token|secret|session|credential/i

const REDACTED = '[REDACTED]'

/**
 * Recursively walks a value and replaces any object property whose key
 * matches {@link SENSITIVE_KEY_PATTERN} with `'[REDACTED]'`. Arrays are
 * walked element-by-element; primitives pass through unchanged.
 *
 * Use this whenever logging payloads that may carry credentials (form data,
 * session objects, validated input, etc.).
 */
export const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(val)
      ])
    )
  }

  return value
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/logger/redact.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger/redact.ts src/lib/logger/redact.test.ts
git commit -m "feat: add redact helper to mask sensitive log fields"
```

---

### Task 2: Plain-text formatter and LogTape configuration

**Files:**

- Create: `src/lib/logger/config.ts`
- Test: `src/lib/logger/config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/logger/config.test.ts
import { describe, expect, test } from 'bun:test'
import type { LogRecord } from '@logtape/logtape'
import { textFormatter } from './config'

const buildRecord = (overrides: Partial<LogRecord> = {}): LogRecord => ({
  category: ['app', 'action', 'organization'],
  level: 'info',
  message: ['Organisasi dibuat'],
  rawMessage: 'Organisasi dibuat',
  timestamp: Date.UTC(2026, 5, 8, 15, 30, 0),
  properties: {},
  ...overrides
})

describe('textFormatter', () => {
  test('renders timestamp, level, category and message as plain text', () => {
    const formatted = textFormatter(buildRecord())

    expect(formatted).toContain('INFO')
    expect(formatted).toContain('app·action·organization')
    expect(formatted).toContain('Organisasi dibuat')
  })

  test('contains no ANSI escape sequences (Dokploy renders raw text)', () => {
    const formatted = textFormatter(buildRecord({ level: 'error' }))

    // eslint-disable-next-line no-control-regex
    expect(formatted).not.toMatch(/\x1b\[/)
  })

  test('renders the level distinctly per record', () => {
    const info = textFormatter(buildRecord({ level: 'info' }))
    const error = textFormatter(
      buildRecord({ level: 'error', message: ['Gagal membuat organisasi'] })
    )

    expect(info).toContain('INFO')
    expect(error).toContain('ERROR')
    expect(error).toContain('Gagal membuat organisasi')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/logger/config.test.ts`
Expected: FAIL with `Cannot find module './config'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/logger/config.ts
import { configure, getConsoleSink, getTextFormatter } from '@logtape/logtape'

/**
 * Plain, human-readable text formatter with no ANSI color codes — Dokploy's
 * web log viewer renders raw text, so escape sequences would show up as
 * garbage. Produces lines like:
 *
 *   [2026-06-08 15:30:00.000 +00] INFO app·action·organization: Organisasi dibuat
 */
export const textFormatter = getTextFormatter({
  timestamp: 'date-time-tz',
  level: 'FULL',
  category: '·',
  format: ({ timestamp, level, category, message }) =>
    `[${timestamp}] ${level} ${category}: ${message}`
})

/**
 * Configures LogTape for the whole app. Must be called exactly once, from
 * `src/instrumentation.ts#register`, before any logger is used.
 *
 * - Root category `["app"]` logs at `info` and above in production, and
 *   `debug` and above in development (`NODE_ENV`).
 * - `["logtape", "meta"]` is capped at `warning` to silence LogTape's own
 *   startup chatter.
 * - The single `console` sink routes by level: `console.error` for
 *   error/fatal, `console.warn` for warning, `console.info`/`console.log`
 *   otherwise — Docker captures both stdout and stderr, both visible in
 *   Dokploy's log viewer.
 */
export const configureLogger = async (): Promise<void> => {
  const isProduction = process.env.NODE_ENV === 'production'

  await configure({
    sinks: {
      console: getConsoleSink({ formatter: textFormatter })
    },
    loggers: [
      {
        category: ['app'],
        sinks: ['console'],
        lowestLevel: isProduction ? 'info' : 'debug'
      },
      {
        category: ['logtape', 'meta'],
        sinks: ['console'],
        lowestLevel: 'warning'
      }
    ]
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/logger/config.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger/config.ts src/lib/logger/config.test.ts
git commit -m "feat: configure LogTape with a plain-text console sink"
```

---

### Task 3: Barrel export

**Files:**

- Create: `src/lib/logger/index.ts`

- [ ] **Step 1: Write the barrel file**

```ts
// src/lib/logger/index.ts
export { getLogger } from '@logtape/logtape'
export * from './config'
export * from './redact'
```

- [ ] **Step 2: Verify it type-checks and re-exports what we need**

Run: `bun run check:types`
Expected: PASS, no new type errors. This confirms `getLogger`, `configureLogger`,
`textFormatter`, and `redact` are all importable from `~/lib/logger`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/logger/index.ts
git commit -m "feat: barrel-export logger utilities from ~/lib/logger"
```

---

### Task 4: Wire up `instrumentation.ts`

**Files:**

- Create: `src/instrumentation.ts`

- [ ] **Step 1: Write the instrumentation file**

```ts
// src/instrumentation.ts
import type { Instrumentation } from 'next'

/**
 * Called once when a new Next.js server instance boots, before it starts
 * handling requests. Configures LogTape so every `getLogger(...)` call
 * across the app writes to the console sink.
 *
 * Guarded by `NEXT_RUNTIME` because `instrumentation.ts` also runs in the
 * Edge runtime, where `@logtape/logtape`'s Node-oriented console sink isn't
 * needed (and importing it eagerly would bloat the edge bundle).
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { configureLogger } = await import('~/lib/logger/config')
    await configureLogger()
  }
}

/**
 * Safety net for *uncaught* server-side errors — RSC render crashes, route
 * handler throws, server actions that escape their own try/catch, etc. This
 * complements (does not replace) the manual `logger.error` calls inside
 * actions: those log expected failure paths with rich context, this one
 * catches whatever slips through.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const [{ getLogger }, { redact }] = await Promise.all([
    import('@logtape/logtape'),
    import('~/lib/logger/redact')
  ])

  const logger = getLogger(['app', 'request'])

  logger.error('Unhandled server error on {method} {path}: {error}', {
    method: request.method,
    path: request.path,
    headers: redact(request.headers),
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    error
  })
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `bun run check:types`
Expected: PASS, no new type errors.

- [ ] **Step 3: Start the dev server and confirm the logger boots**

Run: `bun run dev` (then visit `http://localhost:3000` once and stop the server with Ctrl+C)
Expected: The server starts normally and the terminal shows your app's normal
request logs — no `ConfigError: ... is already configured` or unhandled
rejection from `configureLogger`. (LogTape's own meta messages are suppressed
by the `["logtape", "meta"]` → `warning` setting from Task 2.)

- [ ] **Step 4: Commit**

```bash
git add src/instrumentation.ts
git commit -m "feat: bootstrap LogTape via Next.js instrumentation hooks"
```

---

## Phase 2 — Migrate existing logging & add audit trail

Each task below follows the same shape: add a module-scoped `logger = getLogger([...])`,
replace `console.error`/`console.warn` with `logger.error`/`logger.warning`
(passing the original error as a `{error}` placeholder so the formatter renders
its message and stack), and — where the spec calls for an audit trail — add a
`logger.info` call on the success path with actor + target identifiers (redacted).

No automated tests are added for these edits (they're call-site replacements in
existing, already-tested action code); each task ends with a manual smoke check
plus `check:types`.

### Task 5: Storage (`lib/api/storage.ts`, `lib/actions/storage.ts`)

**Files:**

- Modify: `src/lib/api/storage.ts`
- Modify: `src/lib/actions/storage.ts`

- [ ] **Step 1: Add a logger to `lib/api/storage.ts` and replace its 4 `console.error` calls**

Add the import after the existing `~/env` import (around line 9):

```ts
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])
```

Replace each catch block's `console.error` line:

```ts
    } catch (error) {
      console.error('S3 Upload Error:', error)
      throw new Error('Gagal mengunggah file ke storage.')
    }
```

→

```ts
    } catch (error) {
      logger.error('Gagal mengunggah file ke storage: {error}', { key, error })
      throw new Error('Gagal mengunggah file ke storage.')
    }
```

```ts
    } catch (error) {
      console.error('S3 Signed URL Error:', error)
      throw new Error('Gagal membuat URL akses file.')
    }
```

→

```ts
    } catch (error) {
      logger.error('Gagal membuat URL akses file: {error}', { key, error })
      throw new Error('Gagal membuat URL akses file.')
    }
```

```ts
    } catch (error) {
      console.error('S3 Update Error:', error)
      throw new Error('Gagal memperbarui file di storage.')
    }
```

→

```ts
    } catch (error) {
      logger.error('Gagal memperbarui file di storage: {error}', { key, error })
      throw new Error('Gagal memperbarui file di storage.')
    }
```

```ts
    } catch (error) {
      console.error('S3 Delete Error:', error)
      throw new Error('Gagal menghapus file dari storage.')
    }
```

→

```ts
    } catch (error) {
      logger.error('Gagal menghapus file dari storage: {error}', { key, error })
      throw new Error('Gagal menghapus file dari storage.')
    }
```

- [ ] **Step 2: Add a logger to `lib/actions/storage.ts` and replace its 2 `console.error` calls**

Add the import after `import { storage } from '~/lib/api/storage'` (line 3):

```ts
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])
```

Replace:

```ts
  } catch (error) {
    console.error('getSignedUrlAction Error:', error)
    throw new Error('Gagal mengambil URL gambar.')
  }
```

→

```ts
  } catch (error) {
    logger.error('Gagal mengambil URL gambar: {error}', { path, error })
    throw new Error('Gagal mengambil URL gambar.')
  }
```

Replace:

```ts
  } catch (error) {
    console.error('deleteImageAction Error:', error)
    return { success: false, error: (error as Error).message }
  }
```

→

```ts
  } catch (error) {
    logger.error('Gagal menghapus gambar: {error}', { path, error })
    return { success: false, error: (error as Error).message }
  }
```

- [ ] **Step 3: Verify types and run the existing suite**

Run: `bun run check:types && bun test`
Expected: PASS, no new errors or failures.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/storage.ts src/lib/actions/storage.ts
git commit -m "refactor: replace console.error with logger.error in storage modules"
```

---

### Task 6: Organization actions (`branches/_components/add-form/action.ts`)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts`

- [ ] **Step 1: Add the logger import and instance**

Add after the existing imports (after `import { createOrganization, updateOrganization } from '~/db/query/organization'`):

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'organization'])
```

- [ ] **Step 2: Add an audit-trail `logger.info` and replace the catch in `createOrganizationAction`**

Replace:

```ts
    await createOrganization(validated.data)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    return {
      success: true,
      message: 'Organisasi berhasil ditambahkan!'
    }
  } catch (error) {
    console.error('Error creating organization:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan organisasi.'
    }
  }
```

with:

```ts
    const created = await createOrganization(validated.data)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Organisasi dibuat', {
      actorId: user.id,
      actorRole: user.role,
      organizationId: created?.id,
      input: redact(validated.data)
    })

    return {
      success: true,
      message: 'Organisasi berhasil ditambahkan!'
    }
  } catch (error) {
    logger.error('Gagal membuat organisasi: {error}', {
      error,
      actorId: user.id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan organisasi.'
    }
  }
```

> Check what `createOrganization` returns (`src/db/query/organization.ts`). If it
> resolves to `void` rather than the created row, drop the `organizationId:
created?.id` line (and the `const created = ` assignment) and omit
> `organizationId` from the `logger.info` call.

- [ ] **Step 3: Add an audit-trail `logger.info` and replace the catch in `updateOrganizationAction`**

Replace:

```ts
    await updateOrganization({ ...validated.data }, id)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    return {
      success: true,
      message: 'Organisasi berhasil diperbarui!'
    }
  } catch (error) {
    console.error('Error updating organization:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui organisasi.'
    }
  }
```

with:

```ts
    await updateOrganization({ ...validated.data }, id)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Organisasi diperbarui', {
      actorId: user.id,
      actorRole: user.role,
      organizationId: id,
      input: redact(validated.data)
    })

    return {
      success: true,
      message: 'Organisasi berhasil diperbarui!'
    }
  } catch (error) {
    logger.error('Gagal memperbarui organisasi: {error}', {
      error,
      actorId: user.id,
      organizationId: id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui organisasi.'
    }
  }
```

- [ ] **Step 4: Verify types**

Run: `bun run check:types`
Expected: PASS. If `createOrganization`'s return type makes `created?.id` a type
error, apply the adjustment noted in Step 2.

- [ ] **Step 5: Manual smoke check**

Run: `bun run dev`, log in as a `bpw`/`root` user, create then edit an
organization from `/dashboard/branches`. In the terminal running `dev`, confirm
you see two `INFO app·action·organization` lines (`Organisasi dibuat` /
`Organisasi diperbarui`) with `actorId`/`organizationId` populated, and no
`password`/`token`-shaped values in the output.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts"
git commit -m "feat: log organization mutations with LogTape audit trail"
```

---

### Task 7: Member actions (`kader/_components/add-form/action.ts`)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/kader/_components/add-form/action.ts`

- [ ] **Step 1: Add the logger import and instance**

Add after `import { withMemberCTE } from '~/db/query/cte/member'`:

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])
```

- [ ] **Step 2: Add an audit-trail `logger.info` and an error log in `createMemberAction`**

Replace:

```ts
    await createMember({
      ...validated.data,
      registerNumber
    })

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Gagal menambahkan kader.',
      values: rawData
    }
  }
```

with:

```ts
    await createMember({
      ...validated.data,
      registerNumber
    })

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    logger.info('Kader ditambahkan', {
      actorId: user.id,
      actorRole: user.role,
      registerNumber,
      organizationId: validated.data.organizationId
    })

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: unknown) {
    logger.error('Gagal menambahkan kader: {error}', {
      error,
      actorId: user.id,
      organizationId: validated.data.organizationId,
      input: redact(rawData)
    })
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Gagal menambahkan kader.',
      values: rawData
    }
  }
```

- [ ] **Step 3: Add an audit-trail `logger.info` and replace the catch in `updateMemberAction`**

Replace:

```ts
    await updateMember(data, id)

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    return { success: true, message: 'Data kader berhasil diperbarui!' }
  } catch (error: unknown) {
    console.error(error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui data kader.',
      values: rawData
    }
  }
```

with:

```ts
    await updateMember(data, id)

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    logger.info('Data kader diperbarui', {
      actorId: user.id,
      actorRole: user.role,
      memberId: id,
      organizationId: data.organizationId
    })

    return { success: true, message: 'Data kader berhasil diperbarui!' }
  } catch (error: unknown) {
    logger.error('Gagal memperbarui data kader: {error}', {
      error,
      actorId: user.id,
      memberId: id,
      input: redact(rawData)
    })
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui data kader.',
      values: rawData
    }
  }
```

- [ ] **Step 4: Verify types**

Run: `bun run check:types`
Expected: PASS.

- [ ] **Step 5: Manual smoke check**

Run: `bun run dev`, log in as a `bpk`/`root` user, create then edit a kader from
`/dashboard/kader`. Confirm `INFO app·action·member` lines (`Kader ditambahkan` /
`Data kader diperbarui`) appear with `actorId`/`memberId`/`registerNumber`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/dashboard/kader/_components/add-form/action.ts"
git commit -m "feat: log member create/update mutations with LogTape audit trail"
```

---

### Task 8: Bulk member upload (`kader/_components/bulk-upload/action.ts`)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts`

This action currently has no logging at all (its `catch` swallows the error
silently). Add both an error log and an audit-trail success log.

- [ ] **Step 1: Add the logger import and instance**

Add it next to the other top-level imports (after the last `import` line at the
top of the file):

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])
```

- [ ] **Step 2: Add an audit-trail `logger.info` on success and a `logger.error` in the catch**

Replace:

```ts
    revalidatePath('/dashboard/kader')

    return {
      success: true,
      message: `${credentials.length} kader berhasil ditambahkan.`,
      data: credentials
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan tak terduga.'
    }
  }
}
```

with:

```ts
    revalidatePath('/dashboard/kader')

    logger.info('Bulk upload kader selesai', {
      actorId: user.id,
      actorRole: user.role,
      organizationId,
      trainingId,
      createdCount: credentials.length,
      registerNumbers: credentials.map((c) => c.registerNumber)
    })

    return {
      success: true,
      message: `${credentials.length} kader berhasil ditambahkan.`,
      data: credentials
    }
  } catch (error) {
    logger.error('Gagal melakukan bulk upload kader: {error}', {
      error,
      actorId: user?.id,
      input: redact(input)
    })
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan tak terduga.'
    }
  }
}
```

> `user` is read inside the `try` block (`const { user } = session`), so in the
> `catch` it may be out of scope or `undefined` if the session check failed
> first — that's why the catch uses the optional `user?.id`. If your editor/TS
> flags `user` as not defined in the catch block, change the success-path
> destructure from `const { user } = session` to assign to a `let user`
> declared before the `try`, e.g. `let user: typeof session.user | undefined`
> — or simply drop `actorId: user?.id` from the catch's `logger.error` call.

- [ ] **Step 3: Verify types**

Run: `bun run check:types`
Expected: PASS — resolve the `user` scoping per the note above if needed.

- [ ] **Step 4: Manual smoke check**

Run: `bun run dev`, log in as `bpk`/`root`, run a bulk upload from
`/dashboard/kader`. Confirm an `INFO app·action·member` line `Bulk upload kader
selesai` appears with `createdCount` and `registerNumbers`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts"
git commit -m "feat: add LogTape error and audit logging to bulk member upload"
```

---

### Task 9: Training actions (create + update)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.ts`
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts`

- [ ] **Step 1: Add the logger to `add-training-modal/action.ts` and update `createTrainingAction`**

Add the import near the top (after the last existing `import`):

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'training'])
```

Replace:

```ts
    const created = await trainingQuery.create(data)

    await trainingQuery.addInstructor(created.id, data.masterId, 'master')

    revalidatePath('/dashboard/trainings')
    return {
      success: true,
      message: 'Training created successfully',
      data: created
    }
  } catch (error) {
    console.error('[createTrainingAction]', error)
    return {
      success: false,
      message: 'An unexpected error occurred while creating training'
    }
  }
```

with:

```ts
    const created = await trainingQuery.create(data)

    await trainingQuery.addInstructor(created.id, data.masterId, 'master')

    revalidatePath('/dashboard/trainings')

    logger.info('Dauroh dibuat', {
      actorId: user.id,
      actorRole: user.role,
      trainingId: created.id,
      masterId: data.masterId
    })

    return {
      success: true,
      message: 'Training created successfully',
      data: created
    }
  } catch (error) {
    logger.error('Gagal membuat dauroh: {error}', {
      error,
      actorId: user.id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'An unexpected error occurred while creating training'
    }
  }
```

- [ ] **Step 2: Add the logger to `training-detail-view/action.ts` and update `updateTrainingAction`**

Add the import near the top of the file (after the last existing `import`):

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'training'])
```

Replace:

```ts
    const updated = await trainingQuery.update(data.id, data)
    revalidatePath('/dashboard/trainings')
    return {
      success: true,
      message: 'Training updated successfully',
      data: updated
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while updating training'
    }
  }
}
```

(this is the closing of `updateTrainingAction`, immediately before the
`deleteTrainingAction` export) with:

```ts
    const updated = await trainingQuery.update(data.id, data)
    revalidatePath('/dashboard/trainings')

    logger.info('Dauroh diperbarui', {
      trainingId: data.id,
      changes: redact(data)
    })

    return {
      success: true,
      message: 'Training updated successfully',
      data: updated
    }
  } catch (error) {
    logger.error('Gagal memperbarui dauroh: {error}', {
      error,
      trainingId: rawData.id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'An unexpected error occurred while updating training'
    }
  }
}
```

> Note: `updateTrainingAction` doesn't read the session/actor (unlike
> `createTrainingAction`), so its log entries identify the training by id only.
> That's an existing gap in the action itself — out of scope for this logging
> change. Don't add a session lookup here; just log what's available
> (`data.id` / `rawData.id`).

- [ ] **Step 3: Verify types**

Run: `bun run check:types`
Expected: PASS.

- [ ] **Step 4: Manual smoke check**

Run: `bun run dev`, log in as `bpk`/`root`, create a dauroh from
`/dashboard/trainings` and then edit it from its detail view. Confirm `INFO
app·action·training` lines `Dauroh dibuat` and `Dauroh diperbarui` appear with
`trainingId`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.ts" \
        "src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts"
git commit -m "feat: log training create/update mutations with LogTape audit trail"
```

---

### Task 10: User account actions (`user/account/_components/action.ts`)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/user/account/_components/action.ts`

- [ ] **Step 1: Add the logger import and instance**

Add after `import { z } from 'zod'`:

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'account'])
```

- [ ] **Step 2: Add an audit-trail `logger.info` and replace the catch in `updateProfileAction`**

Replace:

```ts
try {
  await updateUser({ name, displayName }, session.userId)
  updateTag('user')
  revalidatePath('/dashboard/user/account')
  return { success: true }
} catch (e: unknown) {
  console.error(e)
  if (e instanceof Error && e.message?.includes('unique constraint')) {
    return { error: 'Nama pengguna sudah digunakan.' }
  }
  return { error: 'Gagal memperbarui profil.' }
}
```

with:

```ts
try {
  await updateUser({ name, displayName }, session.userId)
  updateTag('user')
  revalidatePath('/dashboard/user/account')

  logger.info('Profil pengguna diperbarui', {
    actorId: session.userId,
    changes: redact({ name, displayName })
  })

  return { success: true }
} catch (e: unknown) {
  logger.error('Gagal memperbarui profil: {error}', {
    error: e,
    actorId: session.userId,
    input: redact({ name, displayName })
  })
  if (e instanceof Error && e.message?.includes('unique constraint')) {
    return { error: 'Nama pengguna sudah digunakan.' }
  }
  return { error: 'Gagal memperbarui profil.' }
}
```

- [ ] **Step 3: Add an audit-trail `logger.info` and replace the catch in `updatePasswordAction`**

Replace:

```ts
    const newPasswordHash = await Bun.password.hash(newPassword)
    await updateUser({ passwordHash: newPasswordHash }, session.userId)

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Gagal memperbarui kata sandi.' }
  }
```

with:

```ts
    const newPasswordHash = await Bun.password.hash(newPassword)
    await updateUser({ passwordHash: newPasswordHash }, session.userId)

    logger.info('Kata sandi pengguna diperbarui', {
      actorId: session.userId
    })

    return { success: true }
  } catch (e) {
    logger.error('Gagal memperbarui kata sandi: {error}', {
      error: e,
      actorId: session.userId
    })
    return { error: 'Gagal memperbarui kata sandi.' }
  }
```

> Notice the `logger.info`/`logger.error` calls intentionally omit
> `currentPassword`/`newPassword`/`confirmPassword` entirely — never pass raw
> password fields into log properties, even through `redact`. `redact` is a
> last line of defense for _nested/incidental_ sensitive fields (e.g. inside
> `rawFormData`), not a license to log credential payloads directly.

- [ ] **Step 4: Verify types**

Run: `bun run check:types`
Expected: PASS.

- [ ] **Step 5: Manual smoke check**

Run: `bun run dev`, log in, update your display name and then your password
from `/dashboard/user/account`. Confirm `INFO app·action·account` lines
(`Profil pengguna diperbarui` / `Kata sandi pengguna diperbarui`) appear, and
that **no password values** show up anywhere in the log output.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/dashboard/user/account/_components/action.ts"
git commit -m "feat: log account profile/password updates with LogTape audit trail"
```

---

### Task 11: Auth actions (login + logout)

**Files:**

- Modify: `src/app/(dashboard)/login/_components/login-form/action.ts`
- Modify: `src/app/(dashboard)/dashboard/_components/logout/action.ts`

These two actions currently have no logging. Add an audit trail covering both
login success/failure and logout.

- [ ] **Step 1: Add the logger to `login-form/action.ts`**

Add after `import { z } from 'zod'`:

```ts
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'auth'])
```

- [ ] **Step 2: Log failed-login attempts and successful logins**

Replace:

```ts
const [user] = await readUserCredential(username)

if (!user) {
  return { error: 'Username atau password salah.' }
}

const isPasswordValid = await Bun.password.verify(password, user.passwordHash)

if (!isPasswordValid) {
  return { error: 'Username atau password salah.' }
}
```

with:

```ts
const [user] = await readUserCredential(username)

if (!user) {
  logger.warning('Percobaan login gagal: username tidak ditemukan', {
    input: redact({ username })
  })
  return { error: 'Username atau password salah.' }
}

const isPasswordValid = await Bun.password.verify(password, user.passwordHash)

if (!isPasswordValid) {
  logger.warning('Percobaan login gagal: password salah', {
    userId: user.id,
    input: redact({ username })
  })
  return { error: 'Username atau password salah.' }
}
```

Then replace:

```ts
const session = await createSession(dbUser.id)

if (!session) {
  return { error: 'Gagal membuat sesi login.' }
}

const cookieStore = await cookies()
cookieStore.set('kammi_id_session', session.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 3 // 3 hari
})

redirect('/dashboard')
```

with:

```ts
const session = await createSession(dbUser.id)

if (!session) {
  logger.error('Gagal membuat sesi login', { userId: dbUser.id })
  return { error: 'Gagal membuat sesi login.' }
}

const cookieStore = await cookies()
cookieStore.set('kammi_id_session', session.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 3 // 3 hari
})

logger.info('Login berhasil', { userId: dbUser.id, username })

redirect('/dashboard')
```

> `redirect()` throws a special `NEXT_REDIRECT` control-flow error under the
> hood — placing `logger.info` immediately _before_ `redirect('/dashboard')`
> (as above) guarantees the log is emitted on the success path without
> interfering with the redirect.
>
> Also note: `username` here is the _login identifier_ (e.g. register number),
> not a credential — it's safe to log directly and useful for correlating
> attempts. `redact({ username })` in the warning branches is there only to
> stay consistent and future-proof if the input shape grows to include more
> fields later.

- [ ] **Step 3: Add the logger to `logout/action.ts` and log on logout**

Add after `import { redirect } from 'next/navigation'`:

```ts
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'auth'])
```

Replace:

```ts
await deleteSession([session.id])

const cookieStore = await cookies()
cookieStore.delete('kammi_id_session')

redirect('/login?message=logout_success')
```

with:

```ts
await deleteSession([session.id])

const cookieStore = await cookies()
cookieStore.delete('kammi_id_session')

logger.info('Logout berhasil', { userId: session.userId })

redirect('/login?message=logout_success')
```

> Check the shape of the object returned by `readActiveSession()`
> (`src/lib/auth/cookies.ts`) — if the active-session record exposes the user
> id under a different property than `userId` (e.g. `session.user.id`), use
> that instead so the log entry actually identifies the actor.

- [ ] **Step 4: Verify types**

Run: `bun run check:types`
Expected: PASS — adjust the `userId` property access per the note above if
needed.

- [ ] **Step 5: Manual smoke check**

Run: `bun run dev`. Try logging in with a wrong password (expect a `WARNING
app·action·auth` line `Percobaan login gagal: password salah`), then log in
successfully (expect `INFO app·action·auth` `Login berhasil`), then log out
(expect `INFO app·action·auth` `Logout berhasil`). Confirm no password values
appear anywhere in the output.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/login/_components/login-form/action.ts" \
        "src/app/(dashboard)/dashboard/_components/logout/action.ts"
git commit -m "feat: add LogTape audit logging for login/logout"
```

---

## Final check

- [ ] **Run the full suite and type-check once more**

Run: `bun run check:types && bun test`
Expected: PASS, no regressions.

- [ ] **Grep for any remaining server-side `console.error`/`console.warn`**

Run:

```bash
grep -rn "console\.\(error\|warn\)" \
  src/app --include="action.ts" \
  src/lib/api src/lib/actions
```

Expected: no output (everything in scope has been migrated to `logger.error`/`logger.warning`).
