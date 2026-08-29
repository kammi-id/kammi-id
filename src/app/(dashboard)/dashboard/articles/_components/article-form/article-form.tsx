'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError
} from '~/components/shadcn/ui/field'
import { Button } from '~/components/shadcn/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { TagInput } from '../tag-input'
import { CategoryCombobox, type CategoryComboboxOption } from '../category-combobox'
import { GalleryUpload } from '../gallery-upload'
import { ArticleBodyEditor } from '../article-body-editor'
import type { ArticleBodyJSON } from '../article-body-editor'
import { ARTICLE_STATUS_LABELS, type ArticleType, type ArticleStatus } from '../_constants'
import { TypeChoiceCards } from './type-choice-cards'
import { articlePernahTerbit, slugify } from './utils'
import { createArticleAction, updateArticleAction } from './action'
import {
  publishedAtToWibWallClock,
  wibWallClockToPublishedAt
} from '~/lib/publikasi/tanggal-terbit'

export type ArticleFormCategory = CategoryComboboxOption

export type ArticleFormInitial = {
  id: string
  type: ArticleType
  title: string
  slug: string
  body: ArticleBodyJSON
  featuredImage?: string | null
  galleryImages: string[]
  penulis?: string | null
  status: ArticleStatus
  tags: string[]
  categoryId?: string | null
  publishedAt?: string | null
}

interface ArticleFormProps {
  organizationId: string
  categories: ArticleFormCategory[]
  tagSuggestions: string[]
  initial?: ArticleFormInitial
}

// Convert a stored `publishedAt` ISO string into the value shape a
// datetime-local input expects ("YYYY-MM-DDTHH:mm") — as Asia/Jakarta wall
// clock, via the ADR 0014 centralized helper. NOT the browser's local
// timezone: this form is filled by a Humas who means "jam 6 pagi WIB" no
// matter what timezone their OS happens to be set to, and `getFullYear()`/
// `getHours()` (local getters) would silently reinterpret the stored WIB
// digits through whatever timezone the browser runs in.
const toDatetimeLocal = (iso?: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return publishedAtToWibWallClock(date)
}

export const ArticleForm = ({
  organizationId,
  categories: initialCategories,
  tagSuggestions,
  initial
}: ArticleFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [type, setType] = useState<ArticleType>(initial?.type ?? 'page')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  // Artikel yang sudah ada (`initial` terisi) dianggap "touched" — persis
  // konvensi `article-category-manager`'s `openEdit` — supaya menyunting
  // Judul draft lama tidak diam-diam menimpa Permalink yang sudah pernah
  // diketik manusia. Artikel baru mulai `false`: autogenerate aktif sejak
  // ketukan pertama.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [slugManuallyUnlocked, setSlugManuallyUnlocked] = useState(false)
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocal(initial?.publishedAt)
  )
  const [featuredImage, setFeaturedImage] = useState(
    initial?.featuredImage ?? ''
  )
  const [galleryImages, setGalleryImages] = useState<string[]>(
    initial?.galleryImages ?? []
  )
  const [penulis, setPenulis] = useState(initial?.penulis ?? '')
  const [categories, setCategories] = useState<ArticleFormCategory[]>(
    initialCategories
  )
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? null
  )
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [body, setBody] = useState<ArticleBodyJSON>(
    initial?.body ?? { type: 'doc', content: [{ type: 'paragraph' }] }
  )
  const [status, setStatus] = useState<ArticleStatus>(
    initial?.status ?? 'draft'
  )

  // Sengaja dibaca dari `initial` (keadaan TERSIMPAN), bukan dari `type`
  // state yang sedang disunting — riwayat "pernah Terbit" milik baris di
  // basis data, tidak berubah hanya karena Tipe sedang diutak-atik di form
  // sebelum disimpan.
  const wasPernahTerbit = initial
    ? articlePernahTerbit({
        type: initial.type,
        status: initial.status,
        publishedAt: initial.publishedAt ? new Date(initial.publishedAt) : null
      })
    : false
  const slugFrozen = wasPernahTerbit && !slugManuallyUnlocked

  const fieldErrors = (name: string) =>
    errors[name]?.map((message) => ({ message }))

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugFrozen && !slugTouched) setSlug(slugify(value))
  }

  const handleSlugChange = (value: string) => {
    setSlugTouched(true)
    setSlug(value)
  }

  const unlockSlug = () => {
    setSlugManuallyUnlocked(true)
    setSlugTouched(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // `publishedAt` di sini adalah nilai mentah `<input type="datetime-local">`
    // — jam dinding WIB tanpa info zona sama sekali, BUKAN waktu lokal
    // browser. `wibWallClockToPublishedAt` menaruh digitnya langsung ke slot
    // UTC (bukan mengonversi lewat zona waktu proses), meniru cara driver
    // basis data membaca `published_at` (ADR 0014, `tanggal-terbit.ts`) —
    // itulah bug yang persis diperingatkan ADR itu: `new Date(publishedAt)`
    // lama membaca string tanpa-zona sebagai waktu lokal, menggeser jam
    // terbit sebesar offset WIB.
    const isoPublishedAt = publishedAt
      ? (wibWallClockToPublishedAt(publishedAt)?.toISOString() ?? undefined)
      : undefined

    const payload = {
      organizationId,
      type,
      title,
      slug,
      body,
      featuredImage: featuredImage || undefined,
      galleryImages,
      penulis: penulis || undefined,
      status,
      tags,
      categoryId: categoryId ?? undefined,
      publishedAt: type === 'blog' ? isoPublishedAt : undefined
    }

    startTransition(async () => {
      const result = initial
        ? await updateArticleAction(initial.id, payload)
        : await createArticleAction(payload)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/articles')
      } else {
        if (result.errors) setErrors(result.errors)
        toast.error(result.message)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'
    >
      <div className='flex min-w-0 flex-col gap-4 lg:col-span-2'>
        <div>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder='Judul artikel'
            aria-label='Judul'
            aria-invalid={Boolean(fieldErrors('title')) || undefined}
            className='font-heading text-foreground h-auto w-full min-w-0 rounded-none border-none bg-transparent p-0 text-3xl font-bold tracking-tight shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 sm:text-4xl'
          />
          <FieldError errors={fieldErrors('title')} />
        </div>

        <ArticleBodyEditor value={body} onChange={setBody} className='flex-1' />
      </div>

      <FieldGroup className='lg:sticky lg:top-6'>
        <Field>
          <FieldLabel>Tipe</FieldLabel>
          <TypeChoiceCards name='article-type' value={type} onChange={setType} />
        </Field>

        {type === 'blog' && (
          <Field
            data-invalid={Boolean(fieldErrors('publishedAt')) || undefined}
          >
            <FieldLabel htmlFor='article-published-at'>
              Tanggal Terbit
            </FieldLabel>
            <Input
              id='article-published-at'
              type='datetime-local'
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              aria-invalid={Boolean(fieldErrors('publishedAt')) || undefined}
            />
            <FieldError errors={fieldErrors('publishedAt')} />
          </Field>
        )}

        {type === 'blog' && (
          <Field data-invalid={Boolean(fieldErrors('penulis')) || undefined}>
            <FieldLabel htmlFor='article-penulis'>Penulis</FieldLabel>
            <Input
              id='article-penulis'
              value={penulis}
              onChange={(e) => setPenulis(e.target.value)}
              placeholder='Nama penulis (opsional)'
              aria-invalid={Boolean(fieldErrors('penulis')) || undefined}
            />
            <FieldError errors={fieldErrors('penulis')} />
          </Field>
        )}

        <Field data-invalid={Boolean(fieldErrors('slug')) || undefined}>
          <FieldLabel htmlFor='article-slug'>Permalink</FieldLabel>
          <Input
            id='article-slug'
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={slugFrozen}
            aria-invalid={Boolean(fieldErrors('slug')) || undefined}
          />
          {slugFrozen ? (
            <>
              <FieldDescription>
                Artikel ini sudah pernah Terbit — Permalink beku (ADR 0014).
              </FieldDescription>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={unlockSlug}
                className='h-auto w-fit px-0 text-xs underline-offset-2 hover:underline'
              >
                Ubah Permalink secara manual
              </Button>
            </>
          ) : (
            <FieldDescription>
              Otomatis mengikuti Judul sampai artikel ini pertama kali Terbit.
            </FieldDescription>
          )}
          <FieldError errors={fieldErrors('slug')} />
        </Field>

        <Field>
          <FieldLabel htmlFor='article-category'>Kategori</FieldLabel>
          <CategoryCombobox
            id='article-category'
            organizationId={organizationId}
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCategoryCreated={(created) =>
              setCategories((prev) => [...prev, created])
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='article-tags'>Tag</FieldLabel>
          <TagInput
            id='article-tags'
            value={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='article-status'>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(val) =>
              setStatus((val as ArticleStatus) ?? 'draft')
            }
          >
            <SelectTrigger id='article-status' className='w-full'>
              <SelectValue placeholder='Pilih status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='draft'>
                {ARTICLE_STATUS_LABELS.draft}
              </SelectItem>
              <SelectItem value='published'>
                {ARTICLE_STATUS_LABELS.published}
              </SelectItem>
              <SelectItem value='archived'>
                {ARTICLE_STATUS_LABELS.archived}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors('featuredImage')) || undefined}
        >
          <FieldLabel>
            Gambar{type === 'blog' ? ' — Utama wajib' : ' (opsional)'}
          </FieldLabel>
          <GalleryUpload
            value={{ featuredImage, galleryImages }}
            onChange={(next) => {
              setFeaturedImage(next.featuredImage)
              setGalleryImages(next.galleryImages)
            }}
            folder='articles'
          />
          <FieldError errors={fieldErrors('featuredImage')} />
        </Field>

        <div className='flex gap-2 pt-2'>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className='size-4 animate-spin'
              />
            )}
            {isPending
              ? 'Menyimpan...'
              : initial
                ? 'Simpan Perubahan'
                : 'Buat Artikel'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/articles')}
            disabled={isPending}
          >
            Batal
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
