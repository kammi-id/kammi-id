import type { AnyExtension } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'

// Daftar-izin toolbar: tajuk, tebal, miring, daftar, kutipan, dan tautan
// sudah dibawa `StarterKit`. `Image` ditambahkan terpisah — satu-satunya
// tipe node yang belum ada di paket dasar. Bentuk JSON yang dihasilkan
// kombinasi ini HARUS tetap selaras dengan daftar-izin di
// article-body-renderer/utils.ts (rute publik `(main)`); lihat
// constants.test.ts untuk kontrak yang diverifikasi.
export const ARTICLE_BODY_EDITOR_EXTENSIONS: AnyExtension[] = [
  StarterKit.configure({
    // Format bawaan StarterKit yang TIDAK ada di daftar-izin perender publik
    // dimatikan di sini, bukan dibiarkan hidup diam-diam. Semuanya tanpa
    // tombol di toolbar, tapi tetap terjangkau pintasan papan ketik (Ctrl+U,
    // Ctrl+Shift+S) dan tempelan dari Word/Google Docs — dan begitu dipakai,
    // formatnya hilang tanpa pesan saat terbit. Lebih baik editor menolak
    // sejak awal daripada memperlihatkan format yang tidak akan pernah naik.
    underline: false,
    strike: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: {
      // Tautan tidak boleh dinavigasi saat sedang menyunting — hanya
      // ditandai lewat toolbar, dibuka via klik cuma di permukaan publik.
      openOnClick: false
    }
  }),
  Image.configure({
    inline: false
  })
]
