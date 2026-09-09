'use client'

import * as React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'
import { Badge } from '~/components/shadcn/ui/badge'
import { Button } from '~/components/shadcn/ui/button'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'

interface TagInputProps {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

// Tags are kept as-typed (preserving the user's casing) but deduped
// case-insensitively, so "Berita" and "berita" can't both be added.
const normalizeTag = (raw: string) => raw.trim()

const isDuplicate = (tags: string[], candidate: string) =>
  tags.some((tag) => tag.toLowerCase() === candidate.toLowerCase())

export const TagInput = ({
  id,
  value,
  onChange,
  suggestions,
  placeholder = 'Ketik tag lalu tekan Enter',
  className,
  'aria-invalid': ariaInvalid
}: TagInputProps) => {
  const [query, setQuery] = React.useState('')

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag || isDuplicate(value, tag)) {
      setQuery('')
      return
    }
    onChange([...value, tag])
    setQuery('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag))
  }

  const availableSuggestions = React.useMemo(() => {
    const remaining = suggestions.filter((tag) => !isDuplicate(value, tag))
    if (!query) return remaining
    return remaining.filter((tag) =>
      tag.toLowerCase().includes(query.toLowerCase())
    )
  }, [suggestions, value, query])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Let the combobox handle Enter when a suggestion is highlighted;
      // otherwise commit the free-text query.
      if (e.key === ',' || query.trim()) {
        e.preventDefault()
        addTag(query)
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      e.preventDefault()
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {value.map((tag) => (
            <Badge key={tag} variant='secondary' data-icon='inline-end'>
              {tag}
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='-mr-1 size-4 opacity-60 hover:opacity-100'
                aria-label={`Hapus tag ${tag}`}
                onClick={() => removeTag(tag)}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className='pointer-events-none'
                />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Combobox
        value={null}
        onValueChange={(val) => {
          if (typeof val === 'string') addTag(val)
        }}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={ariaInvalid || undefined}
          showTrigger={availableSuggestions.length > 0}
        />
        {availableSuggestions.length > 0 && (
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>Tidak ada saran tag.</ComboboxEmpty>
              <ComboboxGroup>
                {availableSuggestions.map((tag) => (
                  <ComboboxItem key={tag} value={tag}>
                    {tag}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        )}
      </Combobox>
    </div>
  )
}
