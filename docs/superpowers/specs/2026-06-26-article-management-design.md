# Article Management — Design Spec

Date: 2026-06-26

## Overview

Manajemen artikel untuk role `humas` (dan `root` untuk debugging), mendukung dua jenis konten dalam satu sistem: halaman statik (page) dan artikel blog. Setiap `humas` hanya dapat mengelola dan melihat artikel milik organisasinya sendiri — tidak ada akses hierarkis ke organisasi induk maupun turunan. `root` memiliki akses lintas-organisasi penuh untuk keperluan debugging.

Rendering halaman publik (termasuk routing subdomain per-organisasi) sudah ditangani infra lain — fitur ini hanya mencakup CRUD & manajemen di dashboard.

## Database Schema

### `article.sql.ts`

Satu tabel untuk kedua jenis artikel, dibedakan lewat kolom `type`.

| Kolom                     | Tipe                                        | Catatan                                                                                    |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`                      | uuid PK                                     |                                                                                            |
| `organizationId`          | uuid FK → `organization.id`                 | NOT NULL, menentukan ownership/scope                                                       |
| `type`                    | enum `'page' \| 'blog'`                     | NOT NULL                                                                                   |
| `title`                   | text                                        | NOT NULL                                                                                   |
| `slug`                    | text                                        | NOT NULL, unique per `organizationId` (composite unique index `(organization_id, slug)`)   |
| `body`                    | jsonb                                       | Tiptap JSON document                                                                       |
| `featuredImage`           | text                                        | nullable, S3 key (pola sama dengan `member.photo`)                                         |
| `publishedAt`             | timestamp                                   | nullable di DB; **wajib diisi di Zod ketika `type='blog'`**, opsional ketika `type='page'` |
| `status`                  | enum `'draft' \| 'published' \| 'archived'` | NOT NULL, default `'draft'`                                                                |
| `tags`                    | text array                                  | free-text, tanpa tabel master                                                              |
| `categoryId`              | uuid FK → `article_category.id`             | nullable, ON DELETE — lihat catatan di bawah                                               |
| `createdAt` / `updatedAt` | timestamp                                   | standar                                                                                    |

Catatan validasi tanggal: `publishedAt` wajib bukan via DB constraint (karena kolom dipakai bersama page & blog), tapi via Zod refine berdasarkan `type`.

### `article_category.sql.ts`

Nested, per-organisasi (meniru pola `organization.parentId`).

| Kolom            | Tipe                                             | Catatan                                       |
| ---------------- | ------------------------------------------------ | --------------------------------------------- |
| `id`             | uuid PK                                          |                                               |
| `organizationId` | uuid FK → `organization.id`                      | NOT NULL                                      |
| `name`           | text                                             | NOT NULL                                      |
| `slug`           | text                                             | NOT NULL, unique per `(organizationId, slug)` |
| `parentId`       | uuid FK → `article_category.id` (self-reference) | nullable                                      |

Tidak ada tabel tag tersendiri. Autocomplete tag didapat dari query distinct atas artikel organisasi yang bersangkutan, bukan tabel master:

```sql
SELECT DISTINCT unnest(tags) FROM article WHERE organization_id = $1
```

## Permission & Scope

Helper baru di `src/db/query/article.ts`, **tidak** reuse `isOrgInScope` (yang ada di `src/db/query/organization.ts`) karena perilakunya berbeda untuk `humas` — `isOrgInScope` saat ini hanya menangani `root` dan `bpk` (hierarkis), dan mengembalikan `false` untuk role lain termasuk `humas`.

```ts
const isArticleOrgInScope = (
  user: { role: string; connectedOrganizationId?: string | null },
  articleOrgId: string
): boolean => {
  if (user.role === 'root') return true
  if (user.role === 'humas')
    return user.connectedOrganizationId === articleOrgId
  return false
}
```

Aturan:

- Hanya `root` dan `humas` dapat mengakses menu Artikel sama sekali — dicek di level sidebar (lihat pola `allowedRolesPublikasi` di `app-sidebar.tsx`).
- `humas` create/edit/delete: `organizationId` artikel otomatis diisi `user.connectedOrganizationId`, tidak bisa memilih organisasi lain.
- `humas` list/detail: query selalu difilter `WHERE organization_id = user.connectedOrganizationId`. Tidak hierarkis — organisasi induk tidak bisa melihat artikel organisasi turunan dan sebaliknya.
- `root` bebas mengakses dan mengelola artikel organisasi manapun untuk keperluan debugging.
- Pola `assertCanManage(articleId)` di setiap `action.ts` mengikuti pola `training`: baca session aktif → ambil `organizationId` artikel dari DB → cek `isArticleOrgInScope` → return error message (string) atau `null` jika diizinkan.

## Struktur Folder

```
src/app/(dashboard)/dashboard/articles/
├── page.tsx                          # list page (route)
├── new/page.tsx                      # create page (route)
├── [id]/page.tsx                     # detail/edit page (route)
├── _data/
│   └── articles.ts                   # 'use cache', cacheLife, cacheTag('articles')
└── _components/
    ├── article-list-view/
    │   ├── article-list-view.tsx     # tabel + search judul + filter status + filter kategori
    │   ├── types.ts
    │   └── index.ts
    ├── article-form/                 # dipakai bersama create & edit
    │   ├── article-form.tsx          # title, body editor, featuredImage, category, tags, publishedAt, status
    │   ├── action.ts                 # createArticleAction, updateArticleAction (Zod)
    │   ├── types.ts
    │   └── index.ts
    ├── article-body-editor/
    │   ├── article-body-editor.tsx   # 'use client' wrapper untuk Tiptap
    │   ├── types.ts
    │   └── index.ts
    ├── delete-article-button/
    │   ├── delete-article-button.tsx # dot-menu, type-to-confirm — mirip DeleteTrainingButton
    │   ├── action.ts                 # deleteArticleAction
    │   └── index.ts
    └── article-category-manager/
        ├── article-category-manager.tsx  # CRUD kategori nested per-organisasi
        ├── action.ts
        ├── types.ts
        └── index.ts
```

Tambahan di luar folder `articles/`:

- `src/db/schema/article.sql.ts`, `src/db/schema/article-category.sql.ts` — schema baru.
- `src/db/query/article.ts` — query layer (list, getById, getBySlug, create, update, delete) + `isArticleOrgInScope`.
- `src/db/query/article-category.ts` — query layer kategori (list per-org, create, update, delete dengan cycle-check).
- Sidebar (`app-sidebar.tsx`): tambah item "Artikel" sebagai submenu di grup Publikasi yang sudah ada (`allowedRolesPublikasi`).

### Dependency baru

- `@tiptap/react`, `@tiptap/starter-kit` (dan extension yang relevan, mis. image/link) untuk body editor.
- Featured image reuse komponen `ImageUpload` (`variant="background"`) + `uploadImageAction` dari `src/lib/actions/storage.ts` yang sudah ada — tidak ada storage baru.

## Error Handling

Konsisten dengan pola `training`:

- Semua server action dibungkus `try/catch`, log via `getLogger(['app', 'action', 'article'])`.
- Return type `ActionResponse<T>` (`{ success, message, errors?, data? }`).
- Validasi Zod gagal → `errors` per-field dikembalikan ke form.
- `assertCanManage` dipanggil di awal setiap mutasi (create/update/delete); gagal → return error message, tidak lanjut query.
- Slug bentrok (unique violation per-organisasi) → ditangkap, pesan: "Permalink sudah dipakai di organisasi ini."
- Kategori yang masih dipakai artikel **tidak dapat dihapus** — block delete dengan pesan error, bukan set `categoryId` jadi `null` secara diam-diam. Mencegah artikel kehilangan kategori tanpa sepengetahuan user.
- Hapus artikel: hard delete (konsisten dengan `deleteTrainingAction`), dengan dialog type-to-confirm.

## Testing

File `*.test.ts` colocated di masing-masing folder atomic, mencakup:

- `isArticleOrgInScope`: `root` selalu `true`; `humas` `true` hanya untuk organisasi sendiri, `false` untuk organisasi lain (termasuk induk/turunan); role lain selalu `false`.
- Zod schema artikel: `publishedAt` wajib ketika `type='blog'`, opsional ketika `type='page'`.
- Slug uniqueness: dua artikel di organisasi berbeda boleh punya slug sama; dalam satu organisasi tidak boleh duplikat.
- `deleteArticleAction`: `humas` tidak bisa menghapus artikel milik organisasi lain (diblok oleh `assertCanManage`).
- Kategori nested: `parentId` tidak boleh membentuk cycle (self-reference ke diri sendiri atau descendant-nya) — divalidasi di action sebelum disimpan.
- Delete kategori yang masih dipakai artikel → diblok dengan error, tidak silently null-kan `categoryId`.

## Out of Scope

- Routing/rendering halaman publik per-subdomain organisasi (sudah ditangani infra lain).
- Status `scheduled` / auto-publish terjadwal (tidak ada infra cron di project; ditunda, status final: `draft | published | archived`).
- Tabel tag master — tag tetap free-text array dengan autocomplete dari distinct existing tags.
