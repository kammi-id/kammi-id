import { randomInt } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const getRandomWordFromDictionary = (): string | null => {
  const filePath = join(process.cwd(), 'dictionary.txt')
  if (!existsSync(filePath)) return null

  const words = readFileSync(filePath, 'utf-8')
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean)

  return words.length > 0 ? words[randomInt(words.length)] : null
}

/**
 * Menghasilkan 5 karakter alfanumerik acak.
 */
export const getRandomAlphanumeric = (length: number = 5): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomInt(chars.length))
  }
  return result
}

/**
 * Password generator: [kata-kamus]-[5 karakter acak]
 * Falls back to pure random if dictionary.txt is not present (build/test env).
 */
export const generatePassword = (): string => {
  const word = getRandomWordFromDictionary()
  const random = getRandomAlphanumeric(5)
  return word ? `${word}-${random}` : getRandomAlphanumeric(12)
}

/**
 * Hashing password menggunakan Bun.password (Argon2id secara default).
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password)
}
