# Image Proxy for S3 Optimization

**Date:** 2026-06-09
**Status:** Approved

## Problem

Gambar yang disimpan di RustFS (`assets.kammi.id`) diakses menggunakan presigned URL yang berisi signature berbeda setiap kali di-generate. Karena Next.js Image Optimization menggunakan full URL sebagai cache key, setiap presigned URL baru menghasilkan cache entry baru — gambar yang sama bisa punya puluhan versi di disk. Selain itu, semua component secara eksplisit menyetel `unoptimized={true}` untuk URL eksternal, sehingga optimisasi tidak pernah berjalan.

## Solution

Buat route internal `/api/images/[...key]` yang bertindak sebagai proxy ke RustFS. Semua akses gambar S3 dialihkan ke route ini dengan URL stabil. Next.js Image Optimization menggunakan URL proxy sebagai cache key yang tidak berubah, sehingga setiap gambar hanya disimpan sekali per ukuran di disk.

## Architecture

### Data Flow

```
Browser → next/image src="/api/images/uploads/uuid.jpg"
         ↓
Next.js Image Optimization
  └─ fetch /api/images/uploads/uuid.jpg (internal)
         ↓
Route Handler: generate presigned URL → fetch dari RustFS → stream response
  └─ Cache-Control: public, max-age=86400
         ↓
Next.js: resize + convert ke WebP → cache on disk dengan key stabil
         ↓
Browser: gambar teroptimasi
```

### Caching Behavior

- Cache key = `/api/images/<key>` — stabil, tidak berubah setiap render
- Request pertama: proxy fetch ke RustFS, Next.js optimisasi + simpan ke disk
- Request berikutnya (ukuran sama): langsung dari disk, RustFS tidak diakses
- Presigned URL di-generate hanya saat cache miss

## Components

### New: `src/app/api/images/[...key]/route.ts`

Route handler yang menerima S3 key dari URL path, men-generate presigned URL server-side, lalu memproxy response dari RustFS.

```ts
export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) => {
  const { key } = await params
  const s3Key = key.join('/')
  const presignedUrl = await storage.client
    .file(s3Key)
    .presign({ expiresIn: 86400 })
  const res = await fetch(presignedUrl)
  if (!res.ok) return new Response('Not Found', { status: 404 })
  return new Response(res.body, {
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
```

### Updated: `src/lib/utils/site-image.ts`

Tidak lagi perlu presign — cukup konversi ke proxy path. Mendukung tiga format input:

- S3 key (tanpa prefix) → `/api/images/<key>`
- Full URL `https://assets.kammi.id/...` → strip base URL, return `/api/images/<key>`
- URL eksternal lain (`http/https`) → dikembalikan as-is
- Path lokal (`/`) → dikembalikan as-is

```ts
export const resolveSiteImage = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('/')) return path
  if (path.startsWith(`${S3_ENDPOINT}/`)) {
    const key = path.slice(`${S3_ENDPOINT}/`.length)
    return `/api/images/${key}`
  }
  if (path.startsWith('http')) return path
  return `/api/images/${path}`
}
```

`S3_ENDPOINT` diimport dari `~/env`. Fungsi ini tetap `async` untuk kompatibilitas dengan caller yang sudah ada.

### Updated: `src/lib/actions/storage.ts` — `getSignedUrlAction`

Selalu dipanggil dengan S3 key, jadi langsung return proxy path:

```ts
export const getSignedUrlAction = async (path: string) => {
  return `/api/images/${path}`
}
```

### Updated: `next.config.ts`

```ts
images: {
  localPatterns: [{ pathname: '/api/images/**', search: '' }],
  remotePatterns: [{ protocol: 'https', hostname: 'assets.kammi.id' }],
  qualities: [75], // required di Next.js 16
}
```

`remotePatterns` untuk `assets.kammi.id` dipertahankan sebagai fallback untuk URL eksternal yang mungkin lolos dari `resolveSiteImage` (misalnya data lama yang bukan dari S3 kita).

`qualities: [75]` wajib diset di Next.js 16 — tanpa ini API optimisasi bisa menolak request quality yang tidak terdaftar.

### Updated: 8 Component Files

Hapus semua `unoptimized={xxx.startsWith('http')}`. Setelah perubahan di atas, semua URL S3 akan dimulai dengan `/api/images/...` (bukan `http`), sehingga kondisi ini selalu `false` dan tidak diperlukan lagi.

File yang terpengaruh:

- `src/app/(main)/_components/home-scene/home-scene.tsx` (3 lokasi)
- `src/app/(main)/_components/leadership-section/leadership-section-client.tsx`
- `src/app/(main)/_components/actions-section/actions-section.tsx` (2 lokasi)
- `src/app/(main)/_components/extra-section/extra-section.tsx`
- `src/app/(main)/_components/hero-section/hero-section.tsx`
- `src/app/(main)/tentang/pengurus/_components/leaders-directory/leaders-directory-client.tsx`
- `src/app/(main)/tentang/pengurus/_components/pengurus-hero/pengurus-hero-client.tsx`

## Security

- Presigned URL di-generate server-side di route handler — credentials tidak pernah terekspos ke client
- URL proxy (`/api/images/*`) bersifat publik — security model-nya setara dengan kondisi saat ini (presigned URL yang muncul di HTML source)
- Bucket tetap private; akses ke RustFS hanya terjadi via route handler

## Out of Scope

- Proteksi per-image berdasarkan session (misalnya foto member yang hanya bisa diakses setelah login) — bisa ditambahkan nanti via middleware di route `/api/images/`
- Format AVIF — bisa diaktifkan dengan menambahkan `formats: ['image/avif', 'image/webp']` ke config
- Upload flow di dashboard tidak berubah — masih menggunakan `uploadImageAction` yang menyimpan S3 key
