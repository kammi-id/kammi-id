'use client'

import { EditorContent, useEditor } from '@tiptap/react'

import { cn } from '~/lib/shadcn/utils'

import { ArticleBodyEditorToolbar } from './article-body-editor-toolbar'
import { ARTICLE_BODY_EDITOR_EXTENSIONS } from './constants'
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
    extensions: ARTICLE_BODY_EDITOR_EXTENSIONS,
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    }
  })

  return (
    <div className={cn('rounded-md border', className)}>
      <ArticleBodyEditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className='prose min-h-48 max-w-none p-3 focus-within:outline-none'
      />
    </div>
  )
}
