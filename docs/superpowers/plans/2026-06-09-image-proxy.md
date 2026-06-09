# Image Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktifkan Next.js Image Optimization untuk gambar S3 private dengan membuat route proxy internal yang stabil, sehingga presigned URL di-generate server-side dan cache key tidak berubah-ubah.

**Architecture:** Route `/api/images/[...key]` menerima S3 key dari URL path, men-generate presigned URL server-side, lalu memproxy response dari RustFS dengan `Cache-Control: public, max-age=86400`. `resolveSiteImage` dan `getSignedUrlAction` diubah untuk return proxy path (`/api/images/<key>`) alih-alih presigned URL. Semua `unoptimized` yang tadinya selalu `true` dihapus dari component.

**Tech Stack:** Next.js 16, Bun (S3Client + test runner), TypeScript

---

## File Map

| Status | File | Perubahan |
|--------|------|-----------|
| **Create** | `src/app/api/images/[...key]/route.ts` | Route handler proxy ke S3 |
| **Create** | `tests/lib/utils/site-image.test.ts` | Unit test untuk resolveSiteImage |
| **Modify** | `next.config.ts` | Tambah `localPatterns`, `qualities` |
| **Modify** | `src/lib/utils/site-image.ts` | Hapus presign, return proxy path |
| **Modify** | `src/lib/actions/storage.ts` | `getSignedUrlAction` return proxy path |
| **Modify** | `src/app/(main)/_components/home-scene/home-scene.tsx` | Hapus `unoptimized` (3 lokasi: baris 638, 900, 952) |
| **Modify** | `src/app/(main)/_components/leadership-section/leadership-section-client.tsx` | Hapus `unoptimized` (baris 248) |
| **Modify** | `src/app/(main)/_components/actions-section/actions-section.tsx` | Hapus `unoptimized` (baris 48, 83) |
| **Modify** | `src/app/(main)/_components/extra-section/extra-section.tsx` | Hapus `unoptimized` (baris 31) |
| **Modify** | `src/app/(main)/_components/hero-section/hero-section.tsx` | Hapus `unoptimized` (baris 36) |
| **Modify** | `src/app/(main)/tentang/pengurus/_components/leaders-directory/leaders-directory-client.tsx` | Hapus `unoptimized` (baris 208) |
| **Modify** | `src/app/(main)/tentang/pengurus/_components/pengurus-hero/pengurus-hero-client.tsx` | Hapus `unoptimized` (baris 229) |

---

## Task 1: Update `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Edit `next.config.ts`**

  Ganti blok `images` yang ada:

  ```ts
  images: {
    localPatterns: [{ pathname: '/api/images/**', search: '' }],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.kammi.id'
      }
    ],
    qualities: [75]
  }
  ```

  File lengkap setelah edit:

  ```ts
  import type { NextConfig } from 'next'

  const nextConfig: NextConfig = {
    output: 'standalone',
    cacheComponents: true,
    reactCompiler: true,
    experimental: {
      viewTransition: true,
      serverActions: {
        bodySizeLimit: '50mb'
      },
      proxyClientMaxBodySize: '50mb'
    },
    images: {
      localPatterns: [{ pathname: '/api/images/**', search: '' }],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'assets.kammi.id'
        }
      ],
      qualities: [75]
    }
  }

  export default nextConfig
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add next.config.ts
  git commit -m "feat: add image localPatterns and qualities to next.config"
  ```

---

## Task 2: Create Image Proxy Route

**Files:**
- Create: `src/app/api/images/[...key]/route.ts`

- [ ] **Step 1: Buat direktori dan file route handler**

  Buat file `src/app/api/images/[...key]/route.ts` dengan konten:

  ```ts
  import { storage } from '~/lib/api/storage'

  export const dynamic = 'force-dynamic'

  export const GET = async (
    _req: Request,
    { params }: { params: Promise<{ key: string[] }> }
  ) => {
    const { key } = await params
    const s3Key = key.join('/')

    try {
      const presignedUrl = await storage.client.file(s3Key).presign({ expiresIn: 86400 })
      const res = await fetch(presignedUrl)
      if (!res.ok) return new Response('Not Found', { status: 404 })
      return new Response(res.body, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch {
      return new Response('Internal Server Error', { status: 500 })
    }
  }
  ```

- [ ] **Step 2: Verifikasi route berjalan**

  Jalankan dev server dan test dengan S3 key yang valid dari database:

  ```bash
  bun dev
  # Di terminal lain:
  curl -I "http://localhost:3000/api/images/<s3-key-yang-valid>"
  ```

  Expected: `HTTP/1.1 200 OK` dengan `Content-Type: image/...`

  Test key tidak valid:

  ```bash
  curl -I "http://localhost:3000/api/images/tidak-ada.jpg"
  ```

  Expected: `HTTP/1.1 404 Not Found`

- [ ] **Step 3: Commit**

  ```bash
  git add "src/app/api/images/[...key]/route.ts"
  git commit -m "feat: add image proxy route for S3 optimization"
  ```

---

## Task 3: Update `resolveSiteImage` + Unit Tests

**Files:**
- Modify: `src/lib/utils/site-image.ts`
- Create: `tests/lib/utils/site-image.test.ts`

- [ ] **Step 1: Tulis failing tests terlebih dahulu**

  Buat file `tests/lib/utils/site-image.test.ts`:

  ```ts
  import { describe, it, expect } from 'bun:test'
  import { resolveSiteImage } from '~/lib/utils/site-image'

  describe('resolveSiteImage', () => {
    it('returns empty string for empty input', async () => {
      expect(await resolveSiteImage('')).toBe('')
    })

    it('returns root-relative paths as-is', async () => {
      expect(await resolveSiteImage('/images/logo.png')).toBe('/images/logo.png')
    })

    it('converts S3 key to proxy URL', async () => {
      expect(await resolveSiteImage('uploads/uuid_photo.jpg')).toBe(
        '/api/images/uploads/uuid_photo.jpg'
      )
    })

    it('converts S3 key without folder to proxy URL', async () => {
      expect(await resolveSiteImage('photo.jpg')).toBe('/api/images/photo.jpg')
    })

    it('returns other external URLs as-is', async () => {
      expect(await resolveSiteImage('https://example.com/image.jpg')).toBe(
        'https://example.com/image.jpg'
      )
    })

    it('converts full path-style S3 URL to proxy path', async () => {
      // Membutuhkan S3_ENDPOINT='https://assets.kammi.id' dan S3_BUCKET_NAME='kammiid' dari .env.local
      const result = await resolveSiteImage('https://assets.kammi.id/kammiid/uploads/uuid.jpg')
      expect(result).toBe('/api/images/uploads/uuid.jpg')
    })
  })
  ```

- [ ] **Step 2: Jalankan tests, pastikan FAIL**

  ```bash
  bun test tests/lib/utils/site-image.test.ts
  ```

  Expected: 5 dari 6 test gagal (fungsi lama masih presign untuk S3 key, bukan return proxy path)

- [ ] **Step 3: Update `resolveSiteImage`**

  Ganti seluruh isi `src/lib/utils/site-image.ts`:

  ```ts
  import { S3_ENDPOINT, S3_BUCKET_NAME } from '~/env'

  /**
   * Resolves a site image value to a stable proxy URL for Next.js Image Optimization.
   * - Root-relative paths (/) are returned as-is.
   * - Full path-style S3 URLs (https://endpoint/bucket/key) are rewritten to the proxy path.
   * - S3 keys are converted to the internal proxy path /api/images/<key>.
   * - Other external URLs are returned as-is (will be unoptimized by next/image).
   */
  export const resolveSiteImage = async (path: string): Promise<string> => {
    if (!path) return ''
    if (path.startsWith('/')) return path
    // Strip both endpoint and bucket name for path-style S3 URLs
    const s3PathPrefix = `${S3_ENDPOINT}/${S3_BUCKET_NAME}/`
    if (S3_ENDPOINT && S3_BUCKET_NAME && path.startsWith(s3PathPrefix)) {
      return `/api/images/${path.slice(s3PathPrefix.length)}`
    }
    if (path.startsWith('http')) return path
    return `/api/images/${path}`
  }
  ```

- [ ] **Step 4: Jalankan tests, pastikan PASS**

  ```bash
  bun test tests/lib/utils/site-image.test.ts
  ```

  Expected: 6/6 PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/utils/site-image.ts tests/lib/utils/site-image.test.ts
  git commit -m "feat: rewrite resolveSiteImage to return stable proxy paths"
  ```

---

## Task 4: Update `getSignedUrlAction`

**Files:**
- Modify: `src/lib/actions/storage.ts`

- [ ] **Step 1: Update `getSignedUrlAction`**

  Ganti fungsi `getSignedUrlAction` di `src/lib/actions/storage.ts`. Fungsi lain di file ini (`uploadImageAction`, `deleteImageAction`) **tidak diubah**.

  Ganti:

  ```ts
  export const getSignedUrlAction = async (path: string) => {
    try {
      return await storage.getSignedUrl(path)
    } catch (error) {
      logger.error('Gagal mengambil URL gambar: {error}', { path, error })
      throw new Error('Gagal mengambil URL gambar.')
    }
  }
  ```

  Dengan:

  ```ts
  export const getSignedUrlAction = async (path: string) => {
    return `/api/images/${path}`
  }
  ```

  Import `storage` dan `logger` di baris 3–6 tidak perlu dihapus karena masih dipakai oleh fungsi lain di file yang sama.

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/actions/storage.ts
  git commit -m "feat: getSignedUrlAction returns stable proxy path instead of presigned URL"
  ```

---

## Task 5: Hapus `unoptimized` dari Components

**Files:**
- Modify: 7 file component (lihat tabel di bawah)

Hapus prop `unoptimized={...}` dari masing-masing lokasi. Setelah perubahan di `resolveSiteImage` dan `getSignedUrlAction`, semua URL S3 sudah mulai dengan `/api/images/...` sehingga prop ini tidak diperlukan lagi.

- [ ] **Step 1: Hapus dari `home-scene.tsx` (3 lokasi)**

  File: `src/app/(main)/_components/home-scene/home-scene.tsx`

  Baris 638 — hapus baris:
  ```tsx
  unoptimized={hero.resolvedImageUrl.startsWith('http')}
  ```

  Baris 900 — hapus baris:
  ```tsx
  unoptimized={photoSrc.startsWith('http')}
  ```

  Baris 952 — hapus baris:
  ```tsx
  unoptimized={photoSrc.startsWith('http')}
  ```

- [ ] **Step 2: Hapus dari `leadership-section-client.tsx`**

  File: `src/app/(main)/_components/leadership-section/leadership-section-client.tsx`

  Baris 248 — hapus baris:
  ```tsx
  unoptimized={photoSrc.startsWith('http')}
  ```

- [ ] **Step 3: Hapus dari `actions-section.tsx` (2 lokasi)**

  File: `src/app/(main)/_components/actions-section/actions-section.tsx`

  Baris 48 — hapus baris:
  ```tsx
  unoptimized={featured.imageSrc.startsWith('http')}
  ```

  Baris 83 — hapus baris:
  ```tsx
  unoptimized={program.imageSrc.startsWith('http')}
  ```

- [ ] **Step 4: Hapus dari `extra-section.tsx`**

  File: `src/app/(main)/_components/extra-section/extra-section.tsx`

  Baris 31 — hapus baris:
  ```tsx
  unoptimized={item.resolvedImageUrl.startsWith('http')}
  ```

- [ ] **Step 5: Hapus dari `hero-section.tsx`**

  File: `src/app/(main)/_components/hero-section/hero-section.tsx`

  Baris 36 — hapus baris:
  ```tsx
  unoptimized={item.resolvedImageUrl.startsWith('http')}
  ```

- [ ] **Step 6: Hapus dari `leaders-directory-client.tsx`**

  File: `src/app/(main)/tentang/pengurus/_components/leaders-directory/leaders-directory-client.tsx`

  Baris 208 — hapus baris:
  ```tsx
  unoptimized={member.photoSrc.startsWith('http')}
  ```

- [ ] **Step 7: Hapus dari `pengurus-hero-client.tsx`**

  File: `src/app/(main)/tentang/pengurus/_components/pengurus-hero/pengurus-hero-client.tsx`

  Baris 229 — hapus baris:
  ```tsx
  unoptimized={member.photoSrc.startsWith('http')}
  ```

- [ ] **Step 8: Jalankan TypeScript check**

  ```bash
  bun run typecheck 2>/dev/null || npx tsc --noEmit
  ```

  Expected: No type errors

- [ ] **Step 9: Verifikasi visual di dev server**

  ```bash
  bun dev
  ```

  Buka halaman utama, halaman pengurus, dan dashboard. Pastikan:
  - Gambar dari S3 tampil dengan benar
  - Di browser DevTools > Network, request gambar lewat `/_next/image?url=%2Fapi%2Fimages%2F...` (bukan presigned URL langsung)
  - Response memiliki `Content-Type: image/webp` (tanda sudah dioptimasi)

- [ ] **Step 10: Commit**

  ```bash
  git add \
    "src/app/(main)/_components/home-scene/home-scene.tsx" \
    "src/app/(main)/_components/leadership-section/leadership-section-client.tsx" \
    "src/app/(main)/_components/actions-section/actions-section.tsx" \
    "src/app/(main)/_components/extra-section/extra-section.tsx" \
    "src/app/(main)/_components/hero-section/hero-section.tsx" \
    "src/app/(main)/tentang/pengurus/_components/leaders-directory/leaders-directory-client.tsx" \
    "src/app/(main)/tentang/pengurus/_components/pengurus-hero/pengurus-hero-client.tsx"
  git commit -m "feat: remove unoptimized prop, images now served via proxy"
  ```
