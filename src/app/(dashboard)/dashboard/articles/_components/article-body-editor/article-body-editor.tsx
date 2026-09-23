'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'

import { cn } from '~/lib/shadcn/utils'
import {
  getSignedUrlAction,
  importImageFromUrlAction,
  uploadImageAction
} from '~/lib/actions/storage'
import { MAX_UPLOAD_BYTES } from '~/lib/api/upload-constraints'

import { ArticleBodyEditorToolbar } from './article-body-editor-toolbar'
import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'
import type { ArticleBodyJSON } from './types'
import {
  hasImportableImage,
  imageFilesFromTransfer,
  rewriteEmbeddedImages,
  toEditorContent,
  toPlainBodyJSON
} from './utils'

interface ArticleBodyEditorProps {
  value?: ArticleBodyJSON
  onChange: (value: ArticleBodyJSON) => void
  /**
   * Dipanggil selagi ada gambar badan tulisan yang sedang diunggah. Formulir
   * memakainya untuk mengunci tombol Simpan: menyimpan di tengah unggahan
   * berarti menyimpan dokumen yang gambarnya belum punya alamat.
   */
  onUploadingChange?: (isUploading: boolean) => void
  className?: string
}

/**
 * Satu-satunya jalur unggah gambar badan tulisan — dipakai tombol toolbar,
 * tempelan papan klip, dan seret-lepas. Sama dengan jalur `src/components/
 * image-upload`; tidak ada jalur unggah baru.
 */
const uploadBodyImage = async (file: File): Promise<string> => {
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error(
      `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)}MB melebihi batas 5MB.`
    )
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'articles')
  return await getSignedUrlAction(await uploadImageAction(formData))
}

/** Menyalin gambar milik server lain ke penyimpanan sendiri — tempelan dari Google Docs dan halaman web. */
const copyRemoteImage = async (url: string): Promise<string> =>
  await getSignedUrlAction(await importImageFromUrlAction(url, 'articles'))

const uploadErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Gagal mengunggah gambar.'

export const ArticleBodyEditor = ({
  value,
  onChange,
  onUploadingChange,
  className
}: ArticleBodyEditorProps) => {
  const [isUploading, setIsUploading] = useState(false)

  // `editorProps` di bawah dibaca ProseMirror, bukan React: penanganannya
  // harus mencapai instance editor dan prop terbaru tanpa bergantung pada
  // closure render mana pun, jadi keduanya lewat ref.
  const editorRef = useRef<Editor | null>(null)
  const pendingRef = useRef(0)
  const onUploadingChangeRef = useRef(onUploadingChange)

  const trackPending = (delta: number) => {
    pendingRef.current += delta
    const next = pendingRef.current > 0
    setIsUploading(next)
    onUploadingChangeRef.current?.(next)
  }

  const runUpload = async (job: () => Promise<void>) => {
    trackPending(1)
    try {
      await job()
    } catch (error) {
      toast.error(uploadErrorMessage(error))
    } finally {
      trackPending(-1)
    }
  }

  const insertImageFiles = (files: File[]) =>
    runUpload(async () => {
      for (const file of files) {
        try {
          const src = await uploadBodyImage(file)
          editorRef.current
            ?.chain()
            .focus()
            .setImage({ src, alt: file.name })
            .run()
        } catch (error) {
          toast.error(uploadErrorMessage(error))
        }
      }
    })

  const insertPastedHtml = (html: string) =>
    runUpload(async () => {
      const rewritten = await rewriteEmbeddedImages(html, {
        uploadFile: uploadBodyImage,
        importUrl: copyRemoteImage
      })
      if (rewritten.dropped > 0)
        toast.error(
          `${rewritten.dropped} gambar tempelan gagal diunggah dan tidak disertakan.`
        )
      if (rewritten.kept > 0)
        toast.warning(
          `${rewritten.kept} gambar tidak bisa disalin ke server dan masih menumpang di sumber aslinya — ikut hilang bila tautan sumbernya mati.`
        )
      editorRef.current?.chain().focus().insertContent(rewritten.html).run()
    })

  useEffect(() => {
    onUploadingChangeRef.current = onUploadingChange
  }, [onUploadingChange])

  const editor = useEditor({
    extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
    // `toEditorContent`, bukan `value` mentah: satu node tak dikenal membuat
    // Tiptap mengganti seluruh dokumen dengan yang kosong. Lihat utils.ts.
    content: toEditorContent(value),
    immediatelyRender: false,
    editorProps: {
      // Ketiga jalan gambar masuk berakhir di penyimpanan sendiri sebagai
      // `/api/images/...`: berkas (tangkapan layar di papan klip,
      // seret-lepas), base64 di dalam HTML tempelan (Word), dan alamat milik
      // server lain (Google Docs). Tanpa ini yang pertama tidak pernah
      // ditangani ProseMirror, yang kedua dibuang pemuat Tiptap, dan yang
      // ketiga cuma menumpang di server sumber sampai tautannya mati.
      handlePaste: (_view, event) => {
        const files = imageFilesFromTransfer(event.clipboardData)
        if (files.length > 0) {
          void insertImageFiles(files)
          return true
        }
        const html = event.clipboardData?.getData('text/html') ?? ''
        if (hasImportableImage(html)) {
          void insertPastedHtml(html)
          return true
        }
        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false
        const files = imageFilesFromTransfer(event.dataTransfer)
        if (files.length === 0) return false
        void insertImageFiles(files)
        return true
      }
    },
    onUpdate: ({ editor }) => {
      // `toPlainBodyJSON` wajib di sini, bukan kenyamanan: `getJSON()`
      // membawa `attrs` berprototipe-nol yang diam-diam dibuang Server
      // Action sebelum sampai basis data. Lihat utils.ts.
      onChange(toPlainBodyJSON(editor.getJSON()))
    }
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  return (
    <div className={cn('flex flex-1 flex-col rounded-md border', className)}>
      <ArticleBodyEditorToolbar
        editor={editor}
        isUploading={isUploading}
        onPickImages={insertImageFiles}
      />
      <EditorContent
        editor={editor}
        className='prose min-h-105 max-w-none flex-1 p-3 focus-within:outline-none'
      />
      <p
        role='status'
        aria-live='polite'
        className='text-muted-foreground px-3 pb-2 text-xs'
      >
        {isUploading ? 'Mengunggah gambar…' : ''}
      </p>
    </div>
  )
}
