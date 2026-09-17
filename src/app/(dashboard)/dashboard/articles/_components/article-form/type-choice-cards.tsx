'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'
import { ARTICLE_TYPE_LABELS, type ArticleType } from '../_constants'

const CONSEQUENCE_COPY: Record<ArticleType, string> = {
  blog: 'Masuk arsip Berita dan bertanggal — tampil di daftar Berita serta Berita KAMMI se-Indonesia.',
  page: 'Berdiri sendiri di alamat akar Situs — tidak bertanggal dan tidak masuk arsip mana pun.'
}

interface TypeChoiceCardsProps {
  name: string
  value: ArticleType
  onChange: (value: ArticleType) => void
}

export const TypeChoiceCards = ({
  name,
  value,
  onChange
}: TypeChoiceCardsProps) => (
  <div
    role='radiogroup'
    aria-label='Tipe artikel'
    className='grid grid-cols-1 gap-2 sm:grid-cols-2'
  >
    {(Object.keys(ARTICLE_TYPE_LABELS) as ArticleType[]).map((type) => {
      const checked = value === type
      return (
        <label
          key={type}
          className={cn(
            'relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-sm transition-colors',
            checked
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          )}
        >
          <input
            type='radio'
            name={name}
            value={type}
            checked={checked}
            onChange={() => onChange(type)}
            className='sr-only'
          />
          <span className='flex items-center justify-between font-medium'>
            {ARTICLE_TYPE_LABELS[type]}
            {checked && (
              <HugeiconsIcon
                icon={Tick02Icon}
                className='text-primary size-4 shrink-0'
                strokeWidth={2}
              />
            )}
          </span>
          <span className='text-muted-foreground text-xs leading-snug'>
            {CONSEQUENCE_COPY[type]}
          </span>
        </label>
      )
    })}
  </div>
)
