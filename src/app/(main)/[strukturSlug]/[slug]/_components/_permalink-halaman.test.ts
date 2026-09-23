import { describe, it, expect } from 'bun:test'
import { resolvePermalinkHalaman } from './_permalink-halaman'

describe('resolvePermalinkHalaman', () => {
  it('tidak ditemukan ketika baris tidak ada', () => {
    const outcome = resolvePermalinkHalaman({ article: undefined })
    expect(outcome).toEqual({ kind: 'not-found' })
  })

  it('tidak ditemukan untuk draft', () => {
    const outcome = resolvePermalinkHalaman({ article: { status: 'draft' } })
    expect(outcome).toEqual({ kind: 'not-found' })
  })

  it('ok untuk published, tanpa noindex — Halaman tidak bertanggal, tidak butuh gerbang Terbit', () => {
    const outcome = resolvePermalinkHalaman({
      article: { status: 'published' }
    })
    expect(outcome).toEqual({ kind: 'ok', noindex: false })
  })

  it('ok untuk archived, ditandai noindex — mengikuti pola Permalink Berita', () => {
    const outcome = resolvePermalinkHalaman({
      article: { status: 'archived' }
    })
    expect(outcome).toEqual({ kind: 'ok', noindex: true })
  })
})
