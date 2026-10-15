import { expect, test, describe } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getRandomAlphanumeric } from './user'

describe('User Utils', () => {
  test('getRandomAlphanumeric returns correct length', () => {
    const res = getRandomAlphanumeric(10)
    expect(res).toHaveLength(10)
    expect(res).toMatch(/^[a-z0-9]+$/)
  })

  test('preserves dictionary and fallback formats without shared files', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'kammi-id-password-'))
    const generateIn = () =>
      Bun.spawnSync(
        [
          process.execPath,
          '-e',
          `Math.random = () => { throw new Error('Math.random must not generate passwords') }; import { generatePassword } from ${JSON.stringify(join(process.cwd(), 'src/lib/utils/user.ts'))}; process.stdout.write(generatePassword())`
        ],
        { cwd }
      )

    try {
      writeFileSync(join(cwd, 'dictionary.txt'), 'apple,banana,cherry')
      const dictionary = generateIn()
      expect(dictionary.exitCode).toBe(0)
      expect(new TextDecoder().decode(dictionary.stdout)).toMatch(
        /^(apple|banana|cherry)-[a-z0-9]{5}$/
      )

      rmSync(join(cwd, 'dictionary.txt'))
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
    } finally {
      Math.random = originalRandom
    }
  })
})
