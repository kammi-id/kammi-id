import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { writeFileSync, unlinkSync, existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { getRandomAlphanumeric, generatePassword } from './user'

const dictionaryPath = join(process.cwd(), 'dictionary.txt')
const backupPath = join(process.cwd(), 'dictionary.txt.bak')
const testWords = 'apel,mangga,jeruk'

describe('getRandomAlphanumeric', () => {
  it('returns string of exact requested length', () => {
    expect(getRandomAlphanumeric(5)).toHaveLength(5)
    expect(getRandomAlphanumeric(10)).toHaveLength(10)
    expect(getRandomAlphanumeric(1)).toHaveLength(1)
  })

  it('returns only lowercase alphanumeric characters', () => {
    const result = getRandomAlphanumeric(50)
    expect(result).toMatch(/^[a-z0-9]+$/)
  })

  it('defaults to length 5', () => {
    expect(getRandomAlphanumeric()).toHaveLength(5)
  })
})

describe('generatePassword (with dictionary)', () => {
  beforeAll(() => {
    if (existsSync(dictionaryPath)) renameSync(dictionaryPath, backupPath)
    writeFileSync(dictionaryPath, testWords)
  })

  afterAll(() => {
    if (existsSync(dictionaryPath)) unlinkSync(dictionaryPath)
    if (existsSync(backupPath)) renameSync(backupPath, dictionaryPath)
  })

  it('returns word-random pattern matching [word]-[5chars]', () => {
    const password = generatePassword()
    expect(password).toMatch(/^[a-zA-Z]+-[a-z0-9]{5}$/)
  })

  it('uses a word from the dictionary', () => {
    const password = generatePassword()
    const [word] = password.split('-')
    expect(['apel', 'mangga', 'jeruk']).toContain(word)
  })
})

describe('generatePassword (without dictionary)', () => {
  beforeAll(() => {
    if (existsSync(dictionaryPath)) renameSync(dictionaryPath, backupPath)
  })

  afterAll(() => {
    if (existsSync(backupPath)) renameSync(backupPath, dictionaryPath)
  })

  it('falls back to 12-char alphanumeric when no dictionary', () => {
    const password = generatePassword()
    expect(password).toHaveLength(12)
    expect(password).toMatch(/^[a-z0-9]+$/)
  })
})
