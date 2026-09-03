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
