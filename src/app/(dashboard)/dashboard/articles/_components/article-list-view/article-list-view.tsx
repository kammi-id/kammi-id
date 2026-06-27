'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/shadcn/ui/table'
import { Badge } from '~/components/shadcn/ui/badge'
import { DeleteArticleButton } from '../delete-article-button'
import type { ArticleListItem, ArticleCategoryOption } from './types'

interface ArticleListViewProps {
  articles: ArticleListItem[]
  categories: ArticleCategoryOption[]
}

const statusLabel: Record<ArticleListItem['status'], string> = {
  draft: 'Draf',
  published: 'Terbit',
  archived: 'Diarsipkan'
}

export const ArticleListView = ({
  articles,
  categories
}: ArticleListViewProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const currentSearch = searchParams.get('search') ?? ''
  const [localSearch, setLocalSearch] = useState(currentSearch)

  useEffect(() => {
    setLocalSearch(currentSearch)
  }, [currentSearch])

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateParam('search', value)
      }, 300)
    },
    [updateParam]
  )

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <Input
          placeholder='Cari judul artikel...'
          aria-label='Cari judul artikel'
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className='max-w-sm'
        />
        <Select
          value={searchParams.get('status') ?? 'all'}
          onValueChange={(val) =>
            updateParam('status', val === 'all' ? '' : (val ?? ''))
          }
        >
          <SelectTrigger className='w-40' aria-label='Filter status'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Semua Status</SelectItem>
            <SelectItem value='draft'>Draf</SelectItem>
            <SelectItem value='published'>Terbit</SelectItem>
            <SelectItem value='archived'>Diarsipkan</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get('categoryId') ?? 'all'}
          onValueChange={(val) =>
            updateParam('categoryId', val === 'all' ? '' : (val ?? ''))
          }
        >
          <SelectTrigger className='w-48' aria-label='Filter kategori'>
            <SelectValue placeholder='Kategori' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Semua Kategori</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judul</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id}>
              <TableCell>
                <Link
                  href={`/dashboard/articles/${article.id}`}
                  className='font-medium hover:underline'
                >
                  {article.title}
                </Link>
              </TableCell>
              <TableCell>
                {article.type === 'blog' ? 'Artikel Blog' : 'Halaman Statik'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    article.status === 'published' ? 'default' : 'secondary'
                  }
                >
                  {statusLabel[article.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <DeleteArticleButton
                  articleId={article.id}
                  title={article.title}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
