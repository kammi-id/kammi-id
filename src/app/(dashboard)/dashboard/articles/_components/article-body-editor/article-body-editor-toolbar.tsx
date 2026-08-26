'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Heading02Icon,
  Heading03Icon,
  ImageUploadIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  ListViewIcon,
  Loading01Icon,
  QuoteUpIcon,
  TextBoldIcon,
  TextItalicIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/shadcn/ui/popover'
import { Toggle } from '~/components/shadcn/ui/toggle'
import { getSignedUrlAction, uploadImageAction } from '~/lib/actions/storage'

interface ArticleBodyEditorToolbarProps {
  editor: Editor | null
}

// Toolbar format badan tulisan Berita/Halaman. Setiap tombol memanggil
// perintah bawaan Tiptap (StarterKit + Image, lihat constants.ts) — tidak
// ada format baru yang direka di sini. Gambar disisipkan lewat
// `uploadImageAction`/`getSignedUrlAction` di `~/lib/actions/storage`, jalur
// unggah yang sama dipakai `src/components/image-upload`; tidak ada jalur
// unggah baru.
export const ArticleBodyEditorToolbar = ({
  editor
}: ArticleBodyEditorToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [isLinkOpen, setIsLinkOpen] = useState(false)

  if (!editor) return null

  const handleLinkOpenChange = (open: boolean) => {
    setIsLinkOpen(open)
    if (open) {
      const href = editor.getAttributes('link').href
      setLinkValue(typeof href === 'string' ? href : '')
    }
  }

  const applyLink = () => {
    const href = linkValue.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setIsLinkOpen(false)
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'articles')
      const uploadedPath = await uploadImageAction(formData)
      const src = await getSignedUrlAction(uploadedPath)
      editor.chain().focus().setImage({ src, alt: file.name }).run()
    } catch (error) {
      console.error('Gagal mengunggah gambar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      role='toolbar'
      aria-label='Alat format badan tulisan'
      className='flex flex-wrap items-center gap-1 border-b p-1'
    >
      <Toggle
        aria-label='Tajuk 2'
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <HugeiconsIcon icon={Heading02Icon} />
      </Toggle>
      <Toggle
        aria-label='Tajuk 3'
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <HugeiconsIcon icon={Heading03Icon} />
      </Toggle>
      <Toggle
        aria-label='Tebal'
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <HugeiconsIcon icon={TextBoldIcon} />
      </Toggle>
      <Toggle
        aria-label='Miring'
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <HugeiconsIcon icon={TextItalicIcon} />
      </Toggle>
      <Toggle
        aria-label='Daftar poin'
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <HugeiconsIcon icon={ListViewIcon} />
      </Toggle>
      <Toggle
        aria-label='Daftar bernomor'
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <HugeiconsIcon icon={LeftToRightListNumberIcon} />
      </Toggle>
      <Toggle
        aria-label='Kutipan'
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <HugeiconsIcon icon={QuoteUpIcon} />
      </Toggle>

      <Popover open={isLinkOpen} onOpenChange={handleLinkOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type='button'
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              size='icon'
              aria-label='Tautan'
              aria-pressed={editor.isActive('link')}
            />
          }
        >
          <HugeiconsIcon icon={Link01Icon} />
        </PopoverTrigger>
        <PopoverContent className='w-64'>
          <div className='flex flex-col gap-2'>
            <Input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder='https://...'
              aria-label='URL tautan'
            />
            <Button type='button' size='sm' onClick={applyLink}>
              Terapkan
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label='Sisipkan gambar'
        onClick={handleImageButtonClick}
        disabled={isUploading}
      >
        <HugeiconsIcon
          icon={isUploading ? Loading01Icon : ImageUploadIcon}
          className={isUploading ? 'animate-spin' : undefined}
        />
      </Button>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleImageFileChange}
      />
    </div>
  )
}
