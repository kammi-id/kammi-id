'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
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
import { createArticleAction, updateArticleAction } from './action'

type ArticleType = 'page' | 'blog'
type ArticleStatus = 'draft' | 'published' | 'archived'

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

  const fieldError = (name: string) => errors[name]?.[0]

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
      <div className='space-y-2'>
        <Label htmlFor='article-type'>Tipe</Label>
        <Select
          value={type}
          onValueChange={(val) => setType((val as ArticleType) ?? 'page')}
        >
          <SelectTrigger id='article-type' className='w-48'>
            <SelectValue placeholder='Pilih tipe' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='page'>Halaman Statik</SelectItem>
            <SelectItem value='blog'>Artikel Blog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='article-title'>Judul</Label>
        <Input
          id='article-title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(fieldError('title'))}
        />
        {fieldError('title') && (
          <p className='text-destructive text-sm'>{fieldError('title')}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='article-slug'>Permalink</Label>
        <Input
          id='article-slug'
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          aria-invalid={Boolean(fieldError('slug'))}
        />
        {fieldError('slug') && (
          <p className='text-destructive text-sm'>{fieldError('slug')}</p>
        )}
      </div>

      {type === 'blog' && (
        <div className='space-y-2'>
          <Label htmlFor='article-published-at'>Tanggal Terbit</Label>
          <Input
            id='article-published-at'
            type='datetime-local'
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            aria-invalid={Boolean(fieldError('publishedAt'))}
            className='w-64'
          />
          {fieldError('publishedAt') && (
            <p className='text-destructive text-sm'>
              {fieldError('publishedAt')}
            </p>
          )}
        </div>
      )}

      <div className='space-y-2'>
        <Label>Gambar Utama</Label>
        <ImageUpload
          value={featuredImage}
          onChange={setFeaturedImage}
          folder='articles'
          variant='background'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='article-category'>Kategori</Label>
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
      </div>

      <div className='space-y-2'>
        <Label htmlFor='article-tags'>Tag</Label>
        <Input
          id='article-tags'
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder='Pisahkan dengan koma'
        />
      </div>

      <div className='space-y-2'>
        <Label>Konten</Label>
        <ArticleBodyEditor value={body} onChange={setBody} />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='article-status'>Status</Label>
        <Select
          value={status}
          onValueChange={(val) => setStatus((val as ArticleStatus) ?? 'draft')}
        >
          <SelectTrigger id='article-status' className='w-48'>
            <SelectValue placeholder='Pilih status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='draft'>Draf</SelectItem>
            <SelectItem value='published'>Terbit</SelectItem>
            <SelectItem value='archived'>Diarsipkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex gap-2'>
        <Button type='submit' disabled={isPending}>
          {initial ? 'Simpan Perubahan' : 'Buat Artikel'}
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
