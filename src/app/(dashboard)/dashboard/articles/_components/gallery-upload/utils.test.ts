import { describe, expect, test } from 'bun:test'
import {
  buildInitialGalleryItems,
  buildInitialGalleryState,
  resolveMainImageId,
  toGalleryUploadValue,
  type GalleryImageItem
} from './utils'

describe('buildInitialGalleryItems', () => {
  test('menaruh featuredImage sebagai elemen pertama, diikuti galleryImages apa adanya', () => {
    const items = buildInitialGalleryItems({
      featuredImage: 'articles/utama.jpg',
      galleryImages: ['articles/a.jpg', 'articles/b.jpg']
    })
    expect(items.map((item) => item.path)).toEqual([
      'articles/utama.jpg',
      'articles/a.jpg',
      'articles/b.jpg'
    ])
  })

  test('tanpa featuredImage, hanya galleryImages yang jadi item', () => {
    const items = buildInitialGalleryItems({
      featuredImage: '',
      galleryImages: ['articles/a.jpg']
    })
    expect(items.map((item) => item.path)).toEqual(['articles/a.jpg'])
  })

  test('artikel baru tanpa gambar sama sekali menghasilkan array kosong', () => {
    expect(
      buildInitialGalleryItems({ featuredImage: '', galleryImages: [] })
    ).toEqual([])
  })
})

describe('buildInitialGalleryState', () => {
  test('featuredImage yang tersimpan menjadi mainId, bukan sekadar item pertama', () => {
    const { items, mainId } = buildInitialGalleryState({
      featuredImage: 'articles/utama.jpg',
      galleryImages: ['articles/a.jpg']
    })
    expect(items[0]?.path).toBe('articles/utama.jpg')
    expect(mainId).toBe(items[0]?.id)
  })

  test('tanpa featuredImage, mainId null meski sudah ada gambar Galeri', () => {
    const { mainId } = buildInitialGalleryState({
      featuredImage: '',
      galleryImages: ['articles/a.jpg']
    })
    expect(mainId).toBeNull()
  })
})

describe('resolveMainImageId — Gambar Utama tidak pernah disimpulkan dari urutan', () => {
  test('mempertahankan mainId yang sama meski urutan id berubah (reorder)', () => {
    const reordered = ['c', 'a', 'b']
    expect(resolveMainImageId(reordered, 'a')).toBe('a')
  })

  test('galeri kosong selalu null', () => {
    expect(resolveMainImageId([], 'a')).toBeNull()
  })

  test('mainId null tetap null walau sudah ada item — Halaman boleh punya Galeri tanpa Gambar Utama (ADR 0017)', () => {
    expect(resolveMainImageId(['x', 'y'], null)).toBeNull()
  })

  test('mainId yang sudah dihapus (bukan lagi anggota) menjadi null, TIDAK jatuh ke item pertama', () => {
    expect(resolveMainImageId(['x', 'y'], 'removed')).toBeNull()
  })
})

describe('toGalleryUploadValue', () => {
  const items: GalleryImageItem[] = [
    { id: '1', path: 'articles/utama.jpg' },
    { id: '2', path: 'articles/a.jpg' },
    { id: '3', path: 'articles/b.jpg' }
  ]

  test('memisahkan item ber-mainId sebagai featuredImage, sisanya galleryImages dengan urutan terjaga', () => {
    const value = toGalleryUploadValue(items, '1')
    expect(value.featuredImage).toBe('articles/utama.jpg')
    expect(value.galleryImages).toEqual(['articles/a.jpg', 'articles/b.jpg'])
  })

  test('mainId di tengah array tetap mengeluarkan sisanya sesuai urutan aslinya', () => {
    const value = toGalleryUploadValue(items, '2')
    expect(value.featuredImage).toBe('articles/a.jpg')
    expect(value.galleryImages).toEqual([
      'articles/utama.jpg',
      'articles/b.jpg'
    ])
  })

  test('mainId null menghasilkan featuredImage kosong dan semua item jadi galleryImages', () => {
    const value = toGalleryUploadValue(items, null)
    expect(value.featuredImage).toBe('')
    expect(value.galleryImages).toEqual(items.map((item) => item.path))
  })

  test('array kosong menghasilkan value kosong', () => {
    expect(toGalleryUploadValue([], null)).toEqual({
      featuredImage: '',
      galleryImages: []
    })
  })
})
