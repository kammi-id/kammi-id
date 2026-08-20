import { randomUUID } from 'node:crypto'
import { mkdir, unlink } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])

/**
 * Akar volume unggahan. Di container ia `/data/uploads`; saat pengembangan
 * `./.uploads` di dalam repo — jangan hardcode, mesin macOS tidak punya
 * `/data`.
 *
 * Dibaca tiap panggilan, bukan dibekukan saat modul dimuat, supaya nilainya
 * tidak bergantung pada urutan impor. Aplikasi menyetelnya sekali di
 * lingkungan, jadi kelakuannya identik; yang berubah cuma tes bisa
 * mengarahkannya ke direktori sementara.
 */
const uploadsRoot = () => resolve(process.env.UPLOADS_DIR || './.uploads')

/**
 * Menerjemahkan kunci menjadi path absolut, atau `null` bila kunci itu keluar
 * dari akar.
 *
 * Di object storage `uploads/a/b.jpg` hanya string. Di filesystem ia path
 * sungguhan, dan kunci datang dari URL maupun dari `FormData`. Karena itu yang
 * diperiksa adalah **hasil resolusinya**, bukan ada-tidaknya `..` sebagai teks:
 * `uploads/../kembali.jpg` sah, `../rahasia.txt` dan `/etc/passwd` tidak.
 */
const resolveKey = (key: string): string | null => {
  if (!key || key.includes('\0')) return null
  const root = uploadsRoot()
  const path = resolve(root, key)
  if (path !== root && !path.startsWith(root + sep)) return null
  return path
}

const requireKey = (key: string): string => {
  const path = resolveKey(key)
  if (!path) {
    logger.error('Kunci berkas keluar dari akar unggahan', { key })
    throw new Error('Kunci berkas tidak sah.')
  }
  return path
}

const writeFileAt = async (key: string, file: File | Blob): Promise<string> => {
  const path = requireKey(key)
  try {
    await mkdir(dirname(path), { recursive: true })
    // `arrayBuffer()` — bukan Blob mentah — karena `Bun.write` hanya mengenali
    // Blob bawaan Bun, dan diam-diam menuliskan "[object Blob]" untuk yang lain.
    await Bun.write(path, await file.arrayBuffer())
    return key
  } catch (error) {
    logger.error('Gagal menulis berkas ke volume: {error}', { key, error })
    throw new Error('Gagal mengunggah file ke storage.')
  }
}

/**
 * Lapisan penyimpanan berkas unggahan. Byte tinggal di volume yang di-mount ke
 * aplikasi, bukan di object storage — lihat ADR 0006.
 */
export const storage = {
  /**
   * Uploads a file to the uploads volume.
   * @param file File or Blob object.
   * @param folder Optional folder path within the volume.
   * @returns The relative key of the uploaded file.
   */
  async uploadFile(
    file: File | Blob,
    folder: string = 'uploads'
  ): Promise<string> {
    const fileName = `${randomUUID()}_${(file as File).name || 'file'}`
    return writeFileAt(`${folder}/${fileName}`, file)
  },

  /**
   * Reads a file from the uploads volume.
   * @param key Relative key of the file.
   * @returns The file, or `null` when the key escapes the root or the file is
   * absent. Berkas hilang bukan kondisi luar biasa: basis data berpindah
   * antar-lingkungan tanpa membawa byte-nya.
   */
  async readFile(key: string) {
    const path = resolveKey(key)
    if (!path) return null
    const file = Bun.file(path)
    return (await file.exists()) ? file : null
  },

  /**
   * Updates an existing file in the uploads volume.
   * @param key Relative key of the file.
   * @param file New File or Blob object.
   * @returns The relative key of the updated file.
   */
  async updateFile(key: string, file: File | Blob): Promise<string> {
    return writeFileAt(key, file)
  },

  /**
   * Deletes a file from the uploads volume. Berkas yang memang sudah tidak ada
   * bukan kegagalan.
   * @param key Relative key of the file.
   */
  async deleteFile(key: string): Promise<void> {
    const path = requireKey(key)
    try {
      await unlink(path)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      logger.error('Gagal menghapus berkas dari volume: {error}', {
        key,
        error
      })
      throw new Error('Gagal menghapus file dari storage.')
    }
  }
}
