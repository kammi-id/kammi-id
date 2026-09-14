import { describe, it, expect } from 'bun:test'
import { buildArticleFrontMatter } from './article-front-matter'

const baseFields = {
  title: 'Judul Biasa',
  date: '2026-09-01T06:00:00+07:00',
  author: 'Budi Santoso',
  organization: 'PW Jabar',
  canonical: 'https://pw-jabar.kammi.id/berita/2026/09/judul-biasa',
  tags: ['kajian', 'daurah']
}

describe('buildArticleFrontMatter', () => {
  it('membuka dan menutup blok dengan `---`, seluruh enam kunci hadir', () => {
    const fm = buildArticleFrontMatter(baseFields)
    const lines = fm.split('\n')
    expect(lines[0]).toBe('---')
    expect(fm).toContain('title: "Judul Biasa"')
    expect(fm).toContain('date: "2026-09-01T06:00:00+07:00"')
    expect(fm).toContain('author: "Budi Santoso"')
    expect(fm).toContain('organization: "PW Jabar"')
    expect(fm).toContain(
      'canonical: "https://pw-jabar.kammi.id/berita/2026/09/judul-biasa"'
    )
    expect(fm).toContain('tags: ["kajian", "daurah"]')
    expect(
      fm
        .trim()
        .split('\n')
        .filter((l) => l === '---')
    ).toHaveLength(2)
  })

  it('meng-escape tanda kutip ganda di dalam judul', () => {
    const fm = buildArticleFrontMatter({
      ...baseFields,
      title: 'Aksi "Bela Palestina" Digelar'
    })
    expect(fm).toContain('title: "Aksi \\"Bela Palestina\\" Digelar"')
  })

  it('membiarkan titik dua di dalam judul apa adanya — aman karena dikutip ganda', () => {
    const fm = buildArticleFrontMatter({
      ...baseFields,
      title: 'Kajian Rutin: Fiqih Muamalah'
    })
    expect(fm).toContain('title: "Kajian Rutin: Fiqih Muamalah"')
  })

  it('meng-escape backslash literal', () => {
    const fm = buildArticleFrontMatter({
      ...baseFields,
      title: 'Path C:\\berkas'
    })
    expect(fm).toContain('title: "Path C:\\\\berkas"')
  })

  it('menulis `null` tanpa kutip ketika Penulis kosong', () => {
    const fm = buildArticleFrontMatter({ ...baseFields, author: null })
    expect(fm).toContain('author: null')
  })

  it('menulis tags kosong sebagai array kosong', () => {
    const fm = buildArticleFrontMatter({ ...baseFields, tags: [] })
    expect(fm).toContain('tags: []')
  })
})
