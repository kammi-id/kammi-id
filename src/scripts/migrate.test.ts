import { afterEach, describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SQL } from 'bun'
import { runMigrations } from './migrate'

const temporaryPaths: string[] = []

const makeTemporaryDirectory = async (prefix: string) => {
  const path = await mkdtemp(join(tmpdir(), prefix))
  temporaryPaths.push(path)
  return path
}

afterEach(async () => {
  await Promise.all(
    temporaryPaths
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true }))
  )
})

const runEntrypoint = async ({
  preflightFails = false,
  migrationsOnly = false,
  runMigrations = false
}: {
  preflightFails?: boolean
  migrationsOnly?: boolean
  runMigrations?: boolean
}) => {
  const directory = await makeTemporaryDirectory('kammi-entrypoint-')
  const tracePath = join(directory, 'trace')
  const fakeBunPath = join(directory, 'bun')

  await writeFile(
    fakeBunPath,
    `#!/bin/sh
printf 'bun %s\\n' "$*" >> "$TRACE"
if [ "$PREFLIGHT_FAILS" = '1' ] && [ "$1" = 'src/scripts/check-duplicates.ts' ]; then
  exit 23
fi
`
  )
  await chmod(fakeBunPath, 0o755)

  const runnerProcess = Bun.spawn({
    cmd: [
      'sh',
      'docker-entrypoint.sh',
      'sh',
      '-c',
      'printf server >> "$TRACE"'
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      MIGRATIONS_ONLY: migrationsOnly ? '1' : '',
      PREFLIGHT_FAILS: preflightFails ? '1' : '0',
      RUN_MIGRATIONS: runMigrations ? '1' : '',
      TRACE: tracePath
    },
    stderr: 'pipe',
    stdout: 'pipe'
  })

  const exitCode = await runnerProcess.exited
  const trace = await readFile(tracePath, 'utf8').catch(() => '')

  return { exitCode, trace }
}

describe('docker-entrypoint', () => {
  it('starts the application directly without RUN_MIGRATIONS', async () => {
    await expect(runEntrypoint({})).resolves.toEqual({
      exitCode: 0,
      trace: 'server'
    })
  })

  it('runs preflight then the guarded migration and exits without HTTP in one-shot mode', async () => {
    await expect(
      runEntrypoint({ migrationsOnly: true, runMigrations: true })
    ).resolves.toEqual({
      exitCode: 0,
      trace:
        'bun src/scripts/check-duplicates.ts\n' + 'bun src/scripts/migrate.ts\n'
    })
  })

  it('starts the application after a non-production migration', async () => {
    await expect(runEntrypoint({ runMigrations: true })).resolves.toEqual({
      exitCode: 0,
      trace:
        'bun src/scripts/check-duplicates.ts\n' +
        'bun src/scripts/migrate.ts\n' +
        'server'
    })
  })

  it('does not run migrations or HTTP after a failed preflight', async () => {
    await expect(
      runEntrypoint({ preflightFails: true, runMigrations: true })
    ).resolves.toEqual({
      exitCode: 23,
      trace: 'bun src/scripts/check-duplicates.ts\n'
    })
  })
})

describe('runMigrations', () => {
  it('uses a ten-second lock timeout on the migrator connection and keeps a failed batch atomic', async () => {
    const databaseUrl = process.env.DATABASE_URL as string
    const migrationsFolder = await makeTemporaryDirectory('kammi-migrations-')
    const migrationName = `20990101000000_lock_timeout_probe_${randomUUID()}`
    const migrationDirectory = join(migrationsFolder, migrationName)
    const tableName = 'migration_lock_timeout_probe'
    const setup = new SQL(databaseUrl)
    const lock = new SQL(databaseUrl)
    const lockedConnection = await lock.reserve()

    try {
      await mkdir(migrationDirectory)
      await writeFile(
        join(migrationDirectory, 'migration.sql'),
        `ALTER TABLE "${tableName}" ADD COLUMN "blocked" integer;`
      )
      await setup.unsafe(`DROP TABLE IF EXISTS "${tableName}"`)
      await setup.unsafe(`CREATE TABLE "${tableName}" (id integer)`)
      await lockedConnection`BEGIN`
      await lockedConnection.unsafe(
        `LOCK TABLE "${tableName}" IN ACCESS EXCLUSIVE MODE`
      )

      const startedAt = Date.now()
      let failure: unknown
      try {
        await runMigrations({ databaseUrl, migrationsFolder })
      } catch (error) {
        failure = error
      }

      expect(
        String(failure instanceof Error ? failure.cause : failure)
      ).toContain('lock timeout')
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(9_500)

      const [columnAfterFailure] = await setup`
        SELECT EXISTS (
          SELECT 1
            FROM information_schema.columns
           WHERE table_name = ${tableName}
             AND column_name = 'blocked'
        ) AS exists
      `
      const [journalAfterFailure] = await setup`
        SELECT count(*)::integer AS count
          FROM drizzle.__drizzle_migrations
         WHERE name = ${migrationName}
      `

      expect(columnAfterFailure.exists).toBe(false)
      expect(journalAfterFailure.count).toBe(0)

      await lockedConnection`ROLLBACK`
      await runMigrations({ databaseUrl, migrationsFolder })
      await runMigrations({ databaseUrl, migrationsFolder })

      const [columnAfterSuccess] = await setup`
        SELECT EXISTS (
          SELECT 1
            FROM information_schema.columns
           WHERE table_name = ${tableName}
             AND column_name = 'blocked'
        ) AS exists
      `
      const [journalAfterSuccess] = await setup`
        SELECT count(*)::integer AS count
          FROM drizzle.__drizzle_migrations
         WHERE name = ${migrationName}
      `

      expect(columnAfterSuccess.exists).toBe(true)
      expect(journalAfterSuccess.count).toBe(1)
    } finally {
      await lockedConnection`ROLLBACK`.catch(() => undefined)
      lockedConnection.release()
      await setup
        .unsafe(`DROP TABLE IF EXISTS "${tableName}"`)
        .catch(() => undefined)
      await setup`
        DELETE FROM drizzle.__drizzle_migrations WHERE name = ${migrationName}
      `.catch(() => undefined)
      await Promise.all([lock.end(), setup.end()])
    }
  }, 15_000)
})
