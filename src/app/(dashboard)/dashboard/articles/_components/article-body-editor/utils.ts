import { getSchema } from '@tiptap/core'

import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'
import type { ArticleBodyJSON } from './types'

const EMPTY_BODY: ArticleBodyJSON = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
}

/** Skema yang sungguh dipakai editor — sumber kebenaran untuk apa yang bisa dimuat. */
const editorSchema = getSchema(ARTICLE_BODY_EDITOR_EXTENSIONS)

type UnknownNode = { type?: unknown; marks?: unknown; content?: unknown }

const stripUnknownSchemaParts = (raw: unknown): UnknownNode | null => {
  if (!raw || typeof raw !== 'object') return null
  const node = raw as UnknownNode
  if (typeof node.type !== 'string' || !(node.type in editorSchema.nodes))
    return null

  const next: UnknownNode = { ...node }
  if (Array.isArray(node.marks))
    // Mark asing dibuang tapi teksnya DIPERTAHANKAN — persis perlakuan
    // perender publik, yang juga tetap menampilkan teksnya tanpa mark itu.
    next.marks = node.marks.filter(
      (mark) =>
        mark &&
        typeof mark === 'object' &&
        typeof (mark as UnknownNode).type === 'string' &&
        ((mark as UnknownNode).type as string) in editorSchema.marks
    )
  if (Array.isArray(node.content))
    next.content = node.content
      .map(stripUnknownSchemaParts)
      .filter((child) => child !== null)
  return next
}

/**
 * Menyiapkan badan tulisan TERSIMPAN agar aman dimuat editor.
 *
 * Tanpa ini, satu node atau mark yang tidak dikenal skema editor membuat
 * ProseMirror melempar saat memuat, dan Tiptap menelan lemparan itu dengan
 * mengganti SELURUH dokumen menjadi kosong. Akibatnya fatal dan senyap:
 * seorang Humas membuka Berita lama, melihat editor kosong, menekan Simpan,
 * dan isi tulisannya hilang dari basis data.
 *
 * Bahaya itu nyata sejak `underline`, `strike`, `code`, `codeBlock`, dan
 * `horizontalRule` dimatikan di constants.ts: baris yang tersimpan sewaktu
 * kelimanya masih hidup kini memuat justru hal-hal yang tidak dikenal skema.
 *
 * Yang dibuang di sini sama persis dengan yang sudah dibuang perender publik,
 * jadi tidak ada satu pun isi yang hilang dari mata pembaca — yang hilang
 * hanyalah format yang memang tidak pernah naik terbit.
 */
export const toEditorContent = (stored: unknown): ArticleBodyJSON => {
  const safe = stripUnknownSchemaParts(stored)
  return safe ? (safe as ArticleBodyJSON) : EMPTY_BODY
}

/**
 * Menjadikan hasil `editor.getJSON()` pohon objek biasa (plain object).
 *
 * ProseMirror membangun `node.attrs` lewat `Object.create(null)` — objek
 * TANPA prototipe. React Server Functions menolak bentuk itu ("Only plain
 * objects, and a few built-ins, can be passed to Server Functions. Classes
 * or null prototypes are not supported"), dan karena Next menyalakan
 * `temporaryReferences` untuk argumen Server Action, penolakan itu tidak
 * melempar melainkan MENGGANTI seluruh `attrs` dengan token rujukan
 * sementara `"$T"` yang tidak pernah sampai ke server. Akibatnya, badan
 * tulisan tersimpan tanpa `attrs`:
 *
 * - `image.attrs.src` hilang → node gambar dibuang daftar-izin perender
 *   publik (`isSafeUrl(undefined)`), jadi gambar inline lenyap setelah simpan.
 * - `heading.attrs.level` hilang → `clampHeadingLevel(undefined)` jatuh ke 1,
 *   jadi setiap Tajuk 2/3 terbit sebagai `<h1>`.
 * - `link.attrs.href` hilang → mark tautan dibuang, tautan jadi teks biasa.
 *
 * Round-trip lewat JSON mencabut prototipe-nol itu. Aman tanpa kehilangan
 * apa pun: dokumen Tiptap memang sudah JSON murni.
 */
export const toPlainBodyJSON = (json: ArticleBodyJSON): ArticleBodyJSON =>
  JSON.parse(JSON.stringify(json)) as ArticleBodyJSON

/** Berkas gambar di dalam papan klip atau seretan — tempelan tangkapan layar, seret-lepas dari Finder/Explorer. */
export const imageFilesFromTransfer = (
  data: DataTransfer | null | undefined
): File[] =>
  data ? [...data.files].filter((file) => file.type.startsWith('image/')) : []

/**
 * Bagaimana sebuah `src` harus diperlakukan sebelum masuk dokumen.
 *
 * - `data` — base64 (tempelan dari Word): WAJIB diunggah, sebab daftar-izin
 *   perender publik menolak `data:` dan gambarnya akan hilang saat terbit.
 * - `remote` — alamat milik server orang lain (tempelan dari Google Docs):
 *   sebaiknya disalin ke penyimpanan sendiri. Ia memang tampil apa adanya,
 *   tapi selama masih menumpang, Berita yang sudah terbit ikut kehilangan
 *   gambarnya begitu tautan sumbernya mati.
 * - `null` — alamat kita sendiri (`/api/images/...` atau seasal), atau skema
 *   yang tidak bisa kita ambil: dibiarkan apa adanya.
 */
const importKindOf = (src: string): 'data' | 'remote' | null => {
  if (src.startsWith('data:image/')) return 'data'
  if (!/^https?:\/\//i.test(src)) return null
  try {
    return new URL(src).origin === window.location.origin ? null : 'remote'
  } catch {
    return null
  }
}

const parseHtml = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html')

/**
 * Apakah tempelan HTML membawa gambar yang perlu dipindahkan ke penyimpanan
 * sendiri. Memakai penilai yang sama persis dengan `rewriteEmbeddedImages`,
 * jadi keputusan "tangkap tempelan ini" tidak bisa menyimpang dari apa yang
 * nanti sungguh dikerjakan.
 */
export const hasImportableImage = (html: string): boolean =>
  [...parseHtml(html).querySelectorAll('img')].some((image) =>
    importKindOf(image.getAttribute('src') ?? '')
  )

/** Mengubah satu `data:image/...;base64,...` menjadi `File` yang siap diunggah. */
export const dataUrlToFile = (dataUrl: string, name: string): File | null => {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(
    dataUrl
  )
  if (!match) return null
  const [, mime, base64] = match
  try {
    const binary = atob(base64.replace(/\s/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new File([bytes], name, { type: mime })
  } catch {
    return null
  }
}

type ImageImporters = {
  /** Mengunggah byte gambar base64, mengembalikan alamat hasil unggahan. */
  uploadFile: (file: File) => Promise<string>
  /** Menyalin gambar di alamat orang lain, mengembalikan alamat hasil salinan. */
  importUrl: (url: string) => Promise<string>
}

/**
 * Memindahkan setiap gambar tempelan ke penyimpanan sendiri dan menukar
 * `src`-nya, SEBELUM HTML itu masuk ke dokumen.
 *
 * Dua kegagalan diperlakukan berbeda dengan sengaja:
 *
 * - base64 yang gagal diunggah DIKELUARKAN (`dropped`) — meninggalkannya
 *   berarti menyimpan gambar yang pasti lenyap saat terbit, tanpa pesan.
 * - alamat jauh yang gagal disalin DIBIARKAN (`kept`) — ia masih tampil,
 *   jadi mengeluarkannya justru membuang isi yang sebelumnya baik-baik saja.
 *
 * Pengunggahnya disuntikkan (bukan diimpor) supaya berkas ini tetap murni dan
 * bisa diuji tanpa menyentuh Server Action maupun penyimpanan.
 */
export const rewriteEmbeddedImages = async (
  html: string,
  { uploadFile, importUrl }: ImageImporters
): Promise<{ html: string; dropped: number; kept: number }> => {
  const parsed = parseHtml(html)
  const targets = [...parsed.querySelectorAll('img')]
    .map((image) => ({
      image,
      src: image.getAttribute('src') ?? '',
      kind: importKindOf(image.getAttribute('src') ?? '')
    }))
    .filter((target) => target.kind !== null)

  if (targets.length === 0) return { html, dropped: 0, kept: 0 }

  let dropped = 0
  let kept = 0
  await Promise.all(
    targets.map(async ({ image, src, kind }) => {
      try {
        if (kind === 'remote') {
          image.setAttribute('src', await importUrl(src))
          return
        }
        const alt = image.getAttribute('alt') || 'gambar-tempelan'
        const file = dataUrlToFile(src, alt)
        if (!file) throw new Error('bukan data-URL gambar yang sah')
        image.setAttribute('src', await uploadFile(file))
      } catch {
        if (kind === 'remote') kept++
        else {
          dropped++
          image.remove()
        }
      }
    })
  )

  return { html: parsed.body.innerHTML, dropped, kept }
}
