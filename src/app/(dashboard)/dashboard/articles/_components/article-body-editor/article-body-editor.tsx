'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { cn } from '~/lib/shadcn/utils'

import type { ArticleBodyJSON } from './types'

interface ArticleBodyEditorProps {
  value?: ArticleBodyJSON
  onChange: (value: ArticleBodyJSON) => void
  className?: string
}

export const ArticleBodyEditor = ({
  value,
  onChange,
  className
}: ArticleBodyEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    }
  })

  return (
    <div className={cn('min-h-48 rounded-md border p-3', className)}>
      <EditorContent editor={editor} />
    </div>
  )
}
