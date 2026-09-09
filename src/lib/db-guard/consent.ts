import { readSync } from 'node:fs'
import { classifyDatabaseUrl } from './database-url'

/**
 * Environment variable that grants consent up front, for runners with no
 * interactive stdin. Deliberately visible and deliberately explicit: a runner
 * that needs in has a way that someone had to write down, rather than a silent
 * shortcut.
 */
export const ACK_ENV_VAR = 'DB_GUARD_ACK'

export type ConsentDecision =
  | { kind: 'allow'; reason: 'local' | 'acknowledged' }
  | { kind: 'prompt'; host: string; database: string }
  | {
      kind: 'refuse'
      reason: 'unreadable-url' | 'no-database-name' | 'no-tty'
    }

export type ConsentInput = {
  databaseUrl: string | undefined | null
  acknowledgement: string | undefined | null
  /** Whether stdin can actually carry an answer back. */
  interactive: boolean
}

/**
 * Decides what a destructive database command is allowed to do, given only
 * facts — no I/O, no prompting. The whole rule lives here so it can be read in
 * one sitting and tested without a database, a TTY, or a network.
 */
export const decideConsent = ({
  databaseUrl,
  acknowledgement,
  interactive
}: ConsentInput): ConsentDecision => {
  const target = classifyDatabaseUrl(databaseUrl)

  // Fail closed: a URL we cannot read is a URL we cannot prove is safe.
  if (!target) return { kind: 'refuse', reason: 'unreadable-url' }

  // Local passes unconditionally — no second signal, no extra flag. A guard
  // that gets in the way daily is a guard people route around, and a guard
  // people route around protects nothing.
  if (target.isLocal) return { kind: 'allow', reason: 'local' }

  if (acknowledgement?.trim()) return { kind: 'allow', reason: 'acknowledged' }

  // Nothing to type back means nothing to check, so an empty answer would
  // match. Checked before the TTY test so the refusal names the real cause
  // rather than blaming a missing terminal that would not have helped.
  if (!target.database) return { kind: 'refuse', reason: 'no-database-name' }

  // No stdin means the prompt would either hang forever or read EOF and pass
  // silently. The second is worse: a guard that fails open.
  if (!interactive) return { kind: 'refuse', reason: 'no-tty' }

  return { kind: 'prompt', host: target.host, database: target.database }
}

export class DatabaseConsentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseConsentError'
  }
}

const REFUSAL_MESSAGE: Record<
  Extract<ConsentDecision, { kind: 'refuse' }>['reason'],
  string
> = {
  'unreadable-url':
    'DATABASE_URL is missing or unparseable. Refusing to connect rather ' +
    'than guessing where it points.',
  'no-database-name':
    'DATABASE_URL names a remote host but no database, so there is nothing ' +
    'to confirm by typing. Refusing to connect.',
  'no-tty':
    'DATABASE_URL points at a remote host, and there is no interactive ' +
    `terminal to confirm on. Set ${ACK_ENV_VAR}=1 to consent up front, or ` +
    'point DATABASE_URL at a local database.'
}

/**
 * Reads one line from stdin without going async, so the guard can run at module
 * load in `src/db/db.ts` without forcing every importer to await it.
 *
 * Returns `null` when stdin cannot be read at all — treated as a refusal by the
 * caller, never as a pass.
 */
const readLineSync = (): string | null => {
  const buffer = Buffer.alloc(256)
  let line = ''

  while (true) {
    let bytesRead: number
    try {
      bytesRead = readSync(0, buffer, 0, buffer.length, null)
    } catch {
      return null
    }

    if (bytesRead === 0) return line.trim()

    const chunk = buffer.toString('utf8', 0, bytesRead)
    const newline = chunk.indexOf('\n')
    if (newline !== -1) return (line + chunk.slice(0, newline)).trim()

    line += chunk
  }
}

/**
 * The gate every destructive door goes through: `bun test`, `db:reset`,
 * `db:seed`, `db:migrate`, `db:push`.
 *
 * Throws `DatabaseConsentError` rather than calling `process.exit`, so a test
 * preload fails the run with a readable reason instead of killing it silently.
 */
export const requireDatabaseConsent = (): void => {
  const decision = decideConsent({
    databaseUrl: process.env.DATABASE_URL,
    acknowledgement: process.env[ACK_ENV_VAR],
    interactive: Boolean(process.stdin?.isTTY)
  })

  if (decision.kind === 'allow') return

  if (decision.kind === 'refuse') {
    throw new DatabaseConsentError(REFUSAL_MESSAGE[decision.reason])
  }

  process.stderr.write(
    `\n⚠️  DATABASE_URL points at a remote host — treat it as production.\n` +
      `   host:     ${decision.host}\n` +
      `   database: ${decision.database}\n\n` +
      `Type the database name to continue, anything else to abort: `
  )

  const typed = readLineSync()

  if (typed !== decision.database) {
    throw new DatabaseConsentError(
      `Aborted: expected "${decision.database}", got "${typed ?? ''}".`
    )
  }
}
