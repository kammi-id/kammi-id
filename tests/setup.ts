import '@testing-library/jest-dom'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'bun:test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local for test environment (bun test does not auto-load it)
const envLocalPath = join(import.meta.dir, '..', '.env.local')
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

// `bun test` tidak boleh menyentuh basis data yang dipakai aplikasi. Kalau
// TEST_DATABASE_URL ada, ia menang mutlak: `.env.local` memuat keduanya, dan
// yang bernama tes itulah yang didapat tes.
//
// Berkas ini tidak memutuskan apakah sasarannya aman — itu tetap milik pagar di
// `src/db/db.ts`, yang menolak host non-lokal. Di sini cuma soal memilih yang
// mana. CI menyetel DATABASE_URL langsung di tingkat job dan tidak punya
// TEST_DATABASE_URL, jadi ia lewat tanpa berubah.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

GlobalRegistrator.register()
expect.extend(matchers)
