import '@testing-library/jest-dom'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load .env.local for tests (Bun does not auto-load .env.local during bun test)
const envLocalPath = join(process.cwd(), '.env.local')
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

GlobalRegistrator.register()
expect.extend(matchers)
