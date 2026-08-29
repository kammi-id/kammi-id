'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Cancel01Icon,
  FolderLibraryIcon
} from '@hugeicons/core-free-icons'
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
import { createCategoryAction } from '../article-category-manager'
import {
  buildCategoryTree,
  flattenCategoryTree,
  type CategoryTreeInput
} from '../category-tree'

export type CategoryComboboxOption = CategoryTreeInput

interface CategoryComboboxProps {
  id?: string
  organizationId: string
  categories: CategoryComboboxOption[]
  value: string | null
  onChange: (categoryId: string | null) => void
  onCategoryCreated: (category: CategoryComboboxOption) => void
  'aria-invalid'?: boolean
}

const CREATE_PREFIX = '__create__:'

// Kategori baru yang dibuat langsung dari combobox ini SELALU jadi akar
// (parentId kosong) — hierarki tetap milik halaman manajer kategori, lihat
// issue 04.
//
// Sama persis dengan `article-category-manager` dan `article-form/utils`'s
// slugify — pengulangan enam baris ini disengaja untuk tiga pemanggil kecil
// yang kebetulan mirip, bukan diekstrak ke `src/lib/` (konvensi flat sendiri).
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const CategoryCombobox = ({
  id,
  organizationId,
  categories,
  value,
  onChange,
  onCategoryCreated,
  'aria-invalid': ariaInvalid
}: CategoryComboboxProps) => {
  const [query, setQuery] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const selected = categories.find((category) => category.id === value) ?? null

  const tree = React.useMemo(
    () => flattenCategoryTree(buildCategoryTree(categories)),
    [categories]
  )

  const filtered = React.useMemo(() => {
    if (!query.trim()) return tree
    const needle = query.trim().toLowerCase()
    return tree.filter((category) => category.name.toLowerCase().includes(needle))
  }, [tree, query])

  const trimmedQuery = query.trim()
  const hasExactMatch = categories.some(
    (category) => category.name.toLowerCase() === trimmedQuery.toLowerCase()
  )
  const canCreate = trimmedQuery.length > 0 && !hasExactMatch

  const createCategory = (name: string) => {
    setIsCreating(true)
    void (async () => {
      const result = await createCategoryAction({
        organizationId,
        name,
        slug: slugify(name)
      })
      setIsCreating(false)
      if (result.success && result.data) {
        const created = result.data as {
          id: string
          name: string
          parentId: string | null
        }
        onCategoryCreated({
          id: created.id,
          name: created.name,
          parentId: created.parentId
        })
        onChange(created.id)
        setQuery('')
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  const handleSelect = (raw: string) => {
    if (raw.startsWith(CREATE_PREFIX)) {
      createCategory(raw.slice(CREATE_PREFIX.length))
      return
    }
    onChange(raw)
    setQuery('')
  }

  return (
    <div className='space-y-2'>
      {selected && (
        <Badge variant='secondary' data-icon='inline-end'>
          {selected.name}
          <Button
            type='button'
            variant='ghost'
            size='icon-xs'
            className='-mr-1 size-4 opacity-60 hover:opacity-100'
            aria-label={`Hapus kategori ${selected.name}`}
            onClick={() => onChange(null)}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className='pointer-events-none'
            />
          </Button>
        </Badge>
      )}

      <Combobox
        value={null}
        onValueChange={(val) => {
          if (typeof val === 'string') handleSelect(val)
        }}
      >
        <ComboboxInput
          id={id}
          placeholder='Cari atau buat kategori'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isCreating}
          aria-invalid={ariaInvalid || undefined}
        />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>Tidak ada kategori ditemukan.</ComboboxEmpty>
            <ComboboxGroup>
              {filtered.map((category) => (
                <ComboboxItem
                  key={category.id}
                  value={category.id}
                  style={{ paddingLeft: `${0.75 + category.depth * 1.25}rem` }}
                >
                  <HugeiconsIcon
                    icon={FolderLibraryIcon}
                    className='size-4 shrink-0 text-muted-foreground'
                  />
                  {category.name}
                </ComboboxItem>
              ))}
              {canCreate && (
                <ComboboxItem value={`${CREATE_PREFIX}${trimmedQuery}`}>
                  <HugeiconsIcon icon={Add01Icon} className='size-4 shrink-0' />
                  Buat kategori &quot;{trimmedQuery}&quot;
                </ComboboxItem>
              )}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
