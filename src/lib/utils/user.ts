import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Membaca kamus dari dictionary.txt dan mengambil satu kata secara acak.
 * Melemparkan error jika file tidak ditemukan atau kosong.
 */
const getRandomWordFromDictionary = (): string => {
  const filePath = join(process.cwd(), 'dictionary.txt')

  if (!existsSync(filePath)) {
    throw new Error('File dictionary.txt tidak ditemukan di root project!')
  }

  const content = readFileSync(filePath, 'utf-8')
  const words = content
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) {
    throw new Error(
      'File dictionary.txt kosong atau tidak memiliki kata yang valid!'
    )
  }

  return words[Math.floor(Math.random() * words.length)]
}

/**
 * Menghasilkan 5 karakter alfanumerik acak.
 */
const getRandomAlphanumeric = (length: number = 5): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Password generator: [kata-kamus]-[5 karakter acak]
 */
export const generatePassword = (): string => {
  const word = getRandomWordFromDictionary()
  const random = getRandomAlphanumeric(5)
  return `${word}-${random}`
}

/**
 * Hashing password menggunakan Bun.password (Argon2id secara default).
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password)
}
