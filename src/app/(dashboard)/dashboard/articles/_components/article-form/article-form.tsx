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
import { ImageUpload } from '~/components/image-upload'
import { ArticleBodyEditor } from '../article-body-editor'
import type { ArticleBodyJSON } from '../article-body-editor'
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_TYPE_LABELS,
  type ArticleType,
  type ArticleStatus
} from '../_constants'
import { createArticleAction, updateArticleAction } from './action'

export type ArticleFormCategory = { id: string; name: string }

export type ArticleFormInitial = {
  id: string
  type: ArticleType
  title: string
  slug: string
  body: ArticleBodyJSON
  featuredImage?: string | null
  status: ArticleStatus
  tags: string[]
  categoryId?: string | null
  publishedAt?: string | null
}

interface ArticleFormProps {
  organizationId: string
  categories: ArticleFormCategory[]
  initial?: ArticleFormInitial
}

const NO_CATEGORY = '__none__'

// Convert an ISO string into the value shape a datetime-local input expects
// ("YYYY-MM-DDTHH:mm"), using the local timezone.
const toDatetimeLocal = (iso?: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const ArticleForm = ({
  organizationId,
  categories,
  initial
}: ArticleFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [type, setType] = useState<ArticleType>(initial?.type ?? 'page')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocal(initial?.publishedAt)
  )
  const [featuredImage, setFeaturedImage] = useState(
    initial?.featuredImage ?? ''
  )
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? NO_CATEGORY
  )
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [body, setBody] = useState<ArticleBodyJSON>(
    initial?.body ?? { type: 'doc', content: [{ type: 'paragraph' }] }
  )
  const [status, setStatus] = useState<ArticleStatus>(
    initial?.status ?? 'draft'
  )

  const fieldErrors = (name: string) =>
    errors[name]?.map((message) => ({ message }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const isoPublishedAt = publishedAt
      ? new Date(publishedAt).toISOString()
      : undefined

    const payload = {
      organizationId,
      type,
      title,
      slug,
      body,
      featuredImage: featuredImage || undefined,
      status,
      tags: parsedTags,
      categoryId: categoryId === NO_CATEGORY ? undefined : categoryId,
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
    <form onSubmit={handleSubmit} className='space-y-6'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='article-type'>Tipe</FieldLabel>
          <Select
            value={type}
            onValueChange={(val) => setType((val as ArticleType) ?? 'page')}
          >
            <SelectTrigger id='article-type' className='w-48'>
              <SelectValue placeholder='Pilih tipe' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='page'>{ARTICLE_TYPE_LABELS.page}</SelectItem>
              <SelectItem value='blog'>{ARTICLE_TYPE_LABELS.blog}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(fieldErrors('title')) || undefined}>
          <FieldLabel htmlFor='article-title'>Judul</FieldLabel>
          <Input
            id='article-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(fieldErrors('title')) || undefined}
          />
          <FieldError errors={fieldErrors('title')} />
        </Field>

        <Field data-invalid={Boolean(fieldErrors('slug')) || undefined}>
          <FieldLabel htmlFor='article-slug'>Permalink</FieldLabel>
          <Input
            id='article-slug'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-invalid={Boolean(fieldErrors('slug')) || undefined}
          />
          <FieldError errors={fieldErrors('slug')} />
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
              className='w-64'
            />
            <FieldError errors={fieldErrors('publishedAt')} />
          </Field>
        )}

        <Field>
          <FieldLabel>Gambar Utama</FieldLabel>
          <ImageUpload
            value={featuredImage}
            onChange={setFeaturedImage}
            folder='articles'
            variant='background'
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='article-category'>Kategori</FieldLabel>
          <Select
            value={categoryId}
            onValueChange={(val) => setCategoryId(val ?? NO_CATEGORY)}
          >
            <SelectTrigger id='article-category' className='w-64'>
              <SelectValue placeholder='Pilih kategori' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>Tanpa Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor='article-tags'>Tag</FieldLabel>
          <Input
            id='article-tags'
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder='Pisahkan dengan koma'
          />
        </Field>

        <Field>
          <FieldLabel>Konten</FieldLabel>
          <ArticleBodyEditor value={body} onChange={setBody} />
        </Field>

        <Field>
          <FieldLabel htmlFor='article-status'>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(val) =>
              setStatus((val as ArticleStatus) ?? 'draft')
            }
          >
            <SelectTrigger id='article-status' className='w-48'>
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
      </FieldGroup>

      <div className='flex gap-2'>
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
    </form>
  )
}
