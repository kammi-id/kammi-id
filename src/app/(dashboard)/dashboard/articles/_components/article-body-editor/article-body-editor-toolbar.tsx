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
import { ACCEPTED_IMAGE_MIME_TYPES } from '~/lib/api/upload-constraints'

interface ArticleBodyEditorToolbarProps {
  editor: Editor | null
  isUploading?: boolean
  onPickImages?: (files: File[]) => void
}

// Toolbar format badan tulisan Berita/Halaman. Setiap tombol memanggil
// perintah bawaan Tiptap (StarterKit + Image, lihat constants.ts) — tidak
// ada format baru yang direka di sini. Unggahan gambar tidak dikerjakan di
// sini: tombol ini cuma memilih berkas dan menyerahkannya ke
// `ArticleBodyEditor`, satu tempat yang sama yang melayani tempelan papan
// klip dan seret-lepas.
export const ArticleBodyEditorToolbar = ({
  editor,
  isUploading = false,
  onPickImages
}: ArticleBodyEditorToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length > 0) onPickImages?.(files)
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
        multiple
        accept={ACCEPTED_IMAGE_MIME_TYPES}
        className='hidden'
        onChange={handleImageFileChange}
      />
    </div>
  )
}
