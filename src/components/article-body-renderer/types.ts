// Bentuk mentah dokumen Tiptap/ProseMirror tersimpan di `article.body`
// (`ArticleBodyJSON` di article-body-editor/types.ts). Tidak dipercaya —
// bisa datang dari baris lama, atau dari permintaan yang dibuat tangan
// lewat Server Action, bukan cuma dari editor.
export type UnsafeArticleBodyNode = {
  type?: unknown
  content?: unknown
  text?: unknown
  marks?: unknown
  attrs?: unknown
}

export type SafeArticleMark = {
  type: 'bold' | 'italic' | 'link'
  href?: string
}

// Pohon HASIL penyaringan daftar-izin — satu-satunya bentuk yang pernah
// disentuh perender React. Setiap `type` di sini sudah lolos allow-list;
// tidak ada jalan bagi node/mark asing untuk lolos sampai sini.
export type SafeArticleBodyNode =
  | { type: 'doc'; content: SafeArticleBodyNode[] }
  | { type: 'paragraph'; content: SafeArticleBodyNode[] }
  | {
      type: 'heading'
      level: 1 | 2 | 3 | 4 | 5 | 6
      content: SafeArticleBodyNode[]
    }
  | { type: 'bulletList'; content: SafeArticleBodyNode[] }
  | { type: 'orderedList'; content: SafeArticleBodyNode[] }
  | { type: 'listItem'; content: SafeArticleBodyNode[] }
  | { type: 'blockquote'; content: SafeArticleBodyNode[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'hardBreak' }
  | { type: 'text'; text: string; marks: SafeArticleMark[] }
