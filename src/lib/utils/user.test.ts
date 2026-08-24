import { expect, test, describe } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getRandomAlphanumeric, generatePassword } from './user'

describe('User Utils', () => {
  test('getRandomAlphanumeric returns correct length', () => {
    const res = getRandomAlphanumeric(10)
    expect(res).toHaveLength(10)
    expect(res).toMatch(/^[a-z0-9]+$/)
  })

  test('generatePassword follows pattern [word]-[random]', () => {
    const password = generatePassword()
    expect(password).toMatch(/^[a-z]+-[a-z0-9]{5}$/)
  })

  test('falls back to twelve random characters without a usable dictionary', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'kammi-id-password-'))
    const generateIn = () =>
      Bun.spawnSync(
        [
          process.execPath,
          '-e',
          `import { generatePassword } from ${JSON.stringify(join(process.cwd(), 'src/lib/utils/user.ts'))}; process.stdout.write(generatePassword())`
        ],
        { cwd }
      )

    try {
      const missingDictionary = generateIn()
      expect(missingDictionary.exitCode).toBe(0)
      expect(new TextDecoder().decode(missingDictionary.stdout)).toMatch(
        /^[a-z0-9]{12}$/
      )

      writeFileSync(join(cwd, 'dictionary.txt'), '')
      const emptyDictionary = generateIn()
      expect(emptyDictionary.exitCode).toBe(0)
      expect(new TextDecoder().decode(emptyDictionary.stdout)).toMatch(
        /^[a-z0-9]{12}$/
      )
    } finally {
      rmSync(cwd, { recursive: true })
    }
  })

  test('does not rely on Math.random', () => {
    const originalRandom = Math.random
    Math.random = () => {
      throw new Error('Math.random must not generate passwords')
    }

    try {
      expect(getRandomAlphanumeric()).toMatch(/^[a-z0-9]{5}$/)
      expect(generatePassword()).toMatch(/^[a-z]+-[a-z0-9]{5}$/)
    } finally {
      Math.random = originalRandom
    }
  })
})
