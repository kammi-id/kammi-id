'use client'

import { useMemo, useState } from 'react'
import { BeritaCard } from '../berita-card'
import type { DemoNewsArticle } from '../../_data/news'

type BeritaFiltersProps = {
  articles: DemoNewsArticle[]
  categories: string[]
}

export const BeritaFilters = ({
  articles,
  categories
}: BeritaFiltersProps) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(categories[0] ?? 'Semua kategori')

  const filteredArticles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return articles.filter((article) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        article.title.toLowerCase().includes(normalizedSearch)
      const matchesCategory =
        category === 'Semua kategori' || article.category === category

      return matchesSearch && matchesCategory
    })
  }, [articles, category, search])

  return (
    <div className='mt-8'>
      <div className='flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row'>
        <label className='sr-only' htmlFor='berita-search'>
          Cari berita berdasarkan judul
        </label>
        <input
          id='berita-search'
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Cari berita berdasarkan judul...'
          className='h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
        />

        <label className='sr-only' htmlFor='berita-category'>
          Filter berdasarkan kategori
        </label>
        <select
          id='berita-category'
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className='h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className='mt-4 text-sm text-slate-500' aria-live='polite'>
        Menampilkan {filteredArticles.length} dari {articles.length} berita
      </p>

      {filteredArticles.length > 0 ? (
        <div className='mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {filteredArticles.map((article) => (
            <BeritaCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className='mt-4 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center'>
          <h2 className='font-heading text-xl font-bold text-slate-950'>
            Berita tidak ditemukan
          </h2>
          <p className='mt-2 text-sm text-slate-500'>
            Coba gunakan kata kunci atau kategori yang berbeda.
          </p>
        </div>
      )}
    </div>
  )
}
