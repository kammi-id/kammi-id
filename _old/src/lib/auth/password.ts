import path from 'node:path'

const ALPHANUMERIC =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Load dictionary at module level using Bun.file and top-level await
 */
const dictionaryPath = path.join(process.cwd(), 'dictionary.txt')
const dictionaryFile = Bun.file(dictionaryPath)

if (!(await dictionaryFile.exists())) {
  throw new Error(
    'Dictionary file not found. Expected at project root: dictionary.txt'
  )
}

const dictionary = (await dictionaryFile.text())
  .split(',')
  .map((city) => city.trim())
  .filter((city) => city.length > 0)

if (dictionary.length === 0) {
  throw new Error('Dictionary file is empty')
}

/**
 * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive)
 */
const getSecureRandomInt = (max: number): number => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

/**
 * Selects a random element from an array using cryptographically secure randomness
 */
const getRandomElement = <T>(array: T[]): T => {
  const index = getSecureRandomInt(array.length)
  return array[index]
}

/**
 * Generates a cryptographically secure random alphanumeric string
 */
const generateRandomAlphanumeric = (length: number): string => {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += getRandomElement(ALPHANUMERIC.split(''))
  }
  return result
}

/**
 * Generates a cryptographically secure random password based on a dictionary.
 * Format: `town1-town2-xxxxx` where xxxxx is a 5-character alphanumeric random string.
 *
 * @returns A secure, humand-readable random password.
 */
export const generatePassword = (): string => {
  const town1 = getRandomElement(dictionary)
  const town2 = getRandomElement(dictionary)
  const randomSuffix = generateRandomAlphanumeric(5)

  return `${town1}-${town2}-${randomSuffix}`
}

/**
 * Generates multiple unique cryptographically secure random passwords.
 *
 * @param count - The number of passwords to generate.
 * @returns An array of unique passwords.
 */
export const generatePasswords = (count: number): string[] => {
  const passwords = new Set<string>()

  while (passwords.size < count) {
    passwords.add(generatePassword())
  }

  return Array.from(passwords)
}
