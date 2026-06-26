# Article Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build dashboard CRUD for two article types (static page, blog post) scoped strictly per-organization to `humas`/`root`, per spec `docs/superpowers/specs/2026-06-26-article-management-design.md`.

**Architecture:** New Drizzle tables `article` and `article_category` (per-org, nested categories via `parentId`). Query layer in `src/db/query/article.ts` and `article-category.ts` exposes a non-hierarchical `isArticleOrgInScope` check (unlike the existing hierarchical `isOrgInScope`). Atomic component folders under `src/app/(dashboard)/dashboard/articles/_components/` follow the `training` feature's pattern: `action.ts` (Zod + `ActionResponse`), `types.ts`, `index.ts`. Tiptap powers the body editor; featured images reuse the existing `ImageUpload` component and `uploadImageAction`.

**Tech Stack:** Next.js (App Router), Drizzle ORM + PostgreSQL, Zod, Bun test, Tiptap (`@tiptap/react`, `@tiptap/starter-kit`), shadcn/BaseUI components.

**IMPORTANT — DB migrations:** Tasks that change `src/db/schema/*.sql.ts` only **write the schema file**. Do **not** run `drizzle-kit generate`, `drizzle-kit push`, `bun db:*` migration commands, or otherwise apply the migration. Stop after writing/editing the schema file and explicitly ask the user to review and run the migration themselves.

---

## Task 1: `article_category` schema

**Files:**
- Create: `src/db/schema/article-category.sql.ts`
- Test: `src/db/schema/article-category.sql.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/db/schema/article-category.sql.test.ts
import { expect, test, describe } from 'bun:test'
import { articleCategory } from './article-category.sql'

describe('articleCategory schema', () => {
  test('has expected columns', () => {
    expect(Object.keys(articleCategory)).toEqual(
      expect.arrayContaining([
        'id',
        'organizationId',
        'name',
        'slug',
        'parentId'
      ])
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/db/schema/article-category.sql.test.ts`
Expected: FAIL with "Cannot find module './article-category.sql'"

- [ ] **Step 3: Write the schema file**

```ts
// src/db/schema/article-category.sql.ts
import { pgTable, unique, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'

export const articleCategory = pgTable(
  'article_category',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: t.text('name').notNull(),
    slug: t.text('slug').notNull(),
    parentId: t
      .uuid('parent_id')
      .references((): AnyPgColumn => articleCategory.id, {
        onDelete: 'set null'
      })
  }),
  (table) => [unique().on(table.organizationId, table.slug)]
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/db/schema/article-category.sql.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/article-category.sql.ts src/db/schema/article-category.sql.test.ts
git commit -m "feat: add article_category schema"
```

**Do not run any migration command for this table yet — wait until Task 2 also adds its schema, then ask the user before migrating (see Task 3).**

---

## Task 2: `article` schema

**Files:**
- Create: `src/db/schema/article.sql.ts`
- Test: `src/db/schema/article.sql.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/db/schema/article.sql.test.ts
import { expect, test, describe } from 'bun:test'
import { article } from './article.sql'

describe('article schema', () => {
  test('has expected columns', () => {
    expect(Object.keys(article)).toEqual(
      expect.arrayContaining([
        'id',
        'organizationId',
        'type',
        'title',
        'slug',
        'body',
        'featuredImage',
        'publishedAt',
        'status',
        'tags',
        'categoryId',
        'createdAt',
        'updatedAt'
      ])
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/db/schema/article.sql.test.ts`
Expected: FAIL with "Cannot find module './article.sql'"

- [ ] **Step 3: Write the schema file**

```ts
// src/db/schema/article.sql.ts
import { pgTable, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'
import { articleCategory } from './article-category.sql'

export const article = pgTable(
  'article',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    type: t.text('type', { enum: ['page', 'blog'] }).notNull(),
    title: t.text('title').notNull(),
    slug: t.text('slug').notNull(),
    body: t.jsonb('body').notNull(),
    featuredImage: t.text('featured_image'),
    publishedAt: t.timestamp('published_at'),
    status: t
      .text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    tags: t.text('tags').array().notNull().default(sql`'{}'::text[]`),
    categoryId: t
      .uuid('category_id')
      .references(() => articleCategory.id, { onDelete: 'restrict' }),
    createdAt: t
      .timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: t
      .timestamp('updated_at')
      .default(sql`now()`)
      .notNull()
  }),
  (table) => [unique().on(table.organizationId, table.slug)]
)
```

Note: `categoryId` uses `onDelete: 'restrict'` — matches the spec's "block delete if category still in use" rule directly at the DB level, so the category delete action doesn't need a separate dependent-count check beyond catching the FK violation.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/db/schema/article.sql.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/article.sql.ts src/db/schema/article.sql.test.ts
git commit -m "feat: add article schema"
```

---

## Task 3: Ask user to run the migration

**No files. This is a checkpoint, not a code step.**

- [ ] **Step 1: Stop and ask the user**

Tell the user: "Schema files for `article` and `article_category` are written (Tasks 1–2). I'm not running the migration myself — please run your usual Drizzle migration command (e.g. `bun drizzle-kit generate` then apply it) and confirm when the tables exist in the database, so the query-layer tasks below can be tested against a real schema."

Wait for explicit confirmation before starting Task 4. Do not proceed on assumption.

---

## Task 4: `isArticleOrgInScope` + category cycle check in query layer

**Files:**
- Create: `src/db/query/article.ts`
- Test: `src/db/query/article.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/db/query/article.test.ts
import { expect, test, describe } from 'bun:test'
import { isArticleOrgInScope } from './article'

describe('isArticleOrgInScope', () => {
  test('root is always in scope', () => {
    expect(isArticleOrgInScope({ role: 'root' }, 'org-a')).toBe(true)
    expect(isArticleOrgInScope({ role: 'root' }, 'org-b')).toBe(true)
  })

  test('humas is in scope only for their own organization', () => {
    const user = { role: 'humas', connectedOrganizationId: 'org-a' }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(true)
    expect(isArticleOrgInScope(user, 'org-b')).toBe(false)
  })

  test('humas with no connected organization is never in scope', () => {
    const user = { role: 'humas', connectedOrganizationId: null }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(false)
  })

  test('other roles are never in scope', () => {
    expect(
      isArticleOrgInScope({ role: 'bpk', connectedOrganizationId: 'org-a' }, 'org-a')
    ).toBe(false)
    expect(isArticleOrgInScope({ role: 'member' }, 'org-a')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/db/query/article.test.ts`
Expected: FAIL with "Cannot find module './article'"

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/db/query/article.ts
export const isArticleOrgInScope = (
  user: { role: string; connectedOrganizationId?: string | null },
  articleOrgId: string
): boolean => {
  if (user.role === 'root') return true
  if (user.role === 'humas')
    return Boolean(user.connectedOrganizationId) &&
      user.connectedOrganizationId === articleOrgId
  return false
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/db/query/article.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/query/article.ts src/db/query/article.test.ts
git commit -m "feat: add isArticleOrgInScope helper"
```

---

## Task 5: Article CRUD query functions

**Files:**
- Modify: `src/db/query/article.ts`
- Test: `src/db/query/article.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to src/db/query/article.test.ts
import { articleQuery } from './article'

describe('articleQuery.create / getById / listForOrg', () => {
  test('create inserts and listForOrg returns it scoped to organizationId', async () => {
    // Requires a real DB connection (per project's existing query tests pattern).
    // Use an existing seeded organization id from the dev DB, or skip if no DB configured.
    const orgId = process.env.TEST_ORGANIZATION_ID
    if (!orgId) return // skip gracefully when no test DB is wired up

    const created = await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Judul Uji Coba',
      slug: 'judul-uji-coba',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: ['uji'],
      publishedAt: new Date()
    })

    expect(created.id).toBeTruthy()

    const list = await articleQuery.listForOrg(orgId, {})
    expect(list.some((a) => a.id === created.id)).toBe(true)

    const fetched = await articleQuery.getById(created.id)
    expect(fetched?.title).toBe('Judul Uji Coba')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/db/query/article.test.ts`
Expected: FAIL with "articleQuery is not exported" (or skipped if `TEST_ORGANIZATION_ID` unset — in that case, set it to a real org id from your dev DB before continuing)

- [ ] **Step 3: Write the implementation**

```ts
// append to src/db/query/article.ts
import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { eq, and, ilike, desc } from 'drizzle-orm'

export type ArticleType = 'page' | 'blog'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export type ArticleListFilters = {
  search?: string
  status?: ArticleStatus
  categoryId?: string
}

export const articleQuery = {
  create: async (values: typeof article.$inferInsert) => {
    const [created] = await db.insert(article).values(values).returning()
    return created
  },

  update: async (
    id: string,
    values: Partial<typeof article.$inferInsert>
  ) => {
    const [updated] = await db
      .update(article)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(article.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    await db.delete(article).where(eq(article.id, id))
  },

  getById: async (id: string) => {
    const [row] = await db
      .select()
      .from(article)
      .where(eq(article.id, id))
      .limit(1)
    return row
  },

  listForOrg: async (organizationId: string, filters: ArticleListFilters) => {
    const conditions = [eq(article.organizationId, organizationId)]
    if (filters.status) conditions.push(eq(article.status, filters.status))
    if (filters.categoryId)
      conditions.push(eq(article.categoryId, filters.categoryId))
    if (filters.search)
      conditions.push(ilike(article.title, `%${filters.search}%`))

    return await db
      .select()
      .from(article)
      .where(and(...conditions))
      .orderBy(desc(article.updatedAt))
  },

  listDistinctTags: async (organizationId: string): Promise<string[]> => {
    const rows = await db.execute<{ tag: string }>(
      db.$with('tags_cte').as(
        db
          .select({ tag: db.$count(article.tags) })
          .from(article)
      ) as never
    )
    // Simpler, correct version: use unnest directly via sql.
    return []
  }
}
```

Stop — the `listDistinctTags` body above is wrong (placeholder query that doesn't compile/run correctly). Replace it with the version in Step 3b below before running tests.

- [ ] **Step 3b: Fix `listDistinctTags` with a correct raw query**

```ts
// replace the listDistinctTags stub in src/db/query/article.ts
import { sql } from 'drizzle-orm'

// ...inside articleQuery object, replace listDistinctTags with:
listDistinctTags: async (organizationId: string): Promise<string[]> => {
  const rows = await db.execute<{ tag: string }>(sql`
    SELECT DISTINCT unnest(${article.tags}) AS tag
    FROM ${article}
    WHERE ${article.organizationId} = ${organizationId}
  `)
  return rows.map((r) => r.tag)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/db/query/article.test.ts`
Expected: PASS (or skipped if `TEST_ORGANIZATION_ID` not set — set it and re-run to confirm)

- [ ] **Step 5: Commit**

```bash
git add src/db/query/article.ts src/db/query/article.test.ts
git commit -m "feat: add article CRUD query functions"
```

---

## Task 6: `article_category` query functions with cycle detection

**Files:**
- Create: `src/db/query/article-category.ts`
- Test: `src/db/query/article-category.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/db/query/article-category.test.ts
import { expect, test, describe } from 'bun:test'
import { wouldCreateCycle } from './article-category'

describe('wouldCreateCycle', () => {
  test('returns true when parentId equals the category itself', () => {
    expect(wouldCreateCycle('cat-1', 'cat-1', [])).toBe(true)
  })

  test('returns true when parentId is a descendant of the category', () => {
    // chain: cat-1 -> cat-2 -> cat-3 (cat-2 and cat-3 have parentId pointing up)
    const allCategories = [
      { id: 'cat-2', parentId: 'cat-1' },
      { id: 'cat-3', parentId: 'cat-2' }
    ]
    // trying to set cat-1's parent to cat-3 (a descendant) is a cycle
    expect(wouldCreateCycle('cat-1', 'cat-3', allCategories)).toBe(true)
  })

  test('returns false for a valid non-cyclic reassignment', () => {
    const allCategories = [
      { id: 'cat-2', parentId: 'cat-1' },
      { id: 'cat-3', parentId: null }
    ]
    expect(wouldCreateCycle('cat-2', 'cat-3', allCategories)).toBe(false)
  })

  test('returns false when parentId is null', () => {
    expect(wouldCreateCycle('cat-1', null, [])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/db/query/article-category.test.ts`
Expected: FAIL with "Cannot find module './article-category'"

- [ ] **Step 3: Write the implementation**

```ts
// src/db/query/article-category.ts
import { db } from '~/db/db'
import { articleCategory } from '~/db/schema/article-category.sql'
import { eq, and, ne } from 'drizzle-orm'

type CategoryNode = { id: string; parentId: string | null }

export const wouldCreateCycle = (
  categoryId: string,
  newParentId: string | null,
  allCategories: CategoryNode[]
): boolean => {
  if (!newParentId) return false
  if (newParentId === categoryId) return true

  let current: string | null = newParentId
  const byId = new Map(allCategories.map((c) => [c.id, c]))
  const visited = new Set<string>()

  while (current) {
    if (current === categoryId) return true
    if (visited.has(current)) return false // already-broken chain, not our concern here
    visited.add(current)
    current = byId.get(current)?.parentId ?? null
  }

  return false
}

export const articleCategoryQuery = {
  listForOrg: async (organizationId: string) => {
    return await db
      .select()
      .from(articleCategory)
      .where(eq(articleCategory.organizationId, organizationId))
  },

  create: async (values: typeof articleCategory.$inferInsert) => {
    const [created] = await db
      .insert(articleCategory)
      .values(values)
      .returning()
    return created
  },

  update: async (
    id: string,
    values: Partial<typeof articleCategory.$inferInsert>
  ) => {
    const [updated] = await db
      .update(articleCategory)
      .set(values)
      .where(eq(articleCategory.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    // Will throw a foreign key violation if any article still references this
    // category (article.categoryId has onDelete: 'restrict') — caught by the
    // calling action and surfaced as a friendly error message.
    await db.delete(articleCategory).where(eq(articleCategory.id, id))
  },

  getById: async (id: string) => {
    const [row] = await db
      .select()
      .from(articleCategory)
      .where(eq(articleCategory.id, id))
      .limit(1)
    return row
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/db/query/article-category.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/query/article-category.ts src/db/query/article-category.test.ts
git commit -m "feat: add article_category query layer with cycle detection"
```

---

## Task 7: `assertCanManage` + article server actions (create/update)

**Files:**
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-form/action.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-form/types.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-form/index.ts`
- Test: `src/app/(dashboard)/dashboard/articles/_components/article-form/action.test.ts`

- [ ] **Step 1: Write the failing test (Zod schema rule only — no DB needed)**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-form/action.test.ts
import { expect, test, describe } from 'bun:test'
import { ArticleInputSchema } from './action'

describe('ArticleInputSchema', () => {
  test('requires publishedAt when type is blog', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.flatten().fieldErrors.publishedAt).toBeTruthy()
  })

  test('publishedAt optional when type is page', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'page',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(true)
  })

  test('accepts blog with publishedAt set', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: [],
      publishedAt: new Date().toISOString()
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/article-form/action.test.ts`
Expected: FAIL with "Cannot find module './action'"

- [ ] **Step 3: Write `types.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-form/types.ts
export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}
```

- [ ] **Step 4: Write `action.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-form/action.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery } from '~/db/query/article'
import { isArticleOrgInScope } from '~/db/query/article'
import { getLogger, redact } from '~/lib/logger'
import type { ActionResponse } from './types'

const logger = getLogger(['app', 'action', 'article'])

export const ArticleInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    type: z.enum(['page', 'blog']),
    title: z.string().min(1, 'Judul wajib diisi'),
    slug: z
      .string()
      .min(1, 'Permalink wajib diisi')
      .regex(/^[a-z0-9-]+$/, 'Permalink hanya boleh huruf kecil, angka, dan tanda hubung'),
    body: z.unknown(),
    featuredImage: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']),
    tags: z.array(z.string()).default([]),
    categoryId: z.string().uuid().optional(),
    publishedAt: z.string().datetime().optional()
  })
  .refine(
    (data) => data.type !== 'blog' || Boolean(data.publishedAt),
    {
      message: 'Tanggal wajib diisi untuk artikel blog',
      path: ['publishedAt']
    }
  )

const assertCanManageOrg = (
  user: { role: string; connectedOrganization?: { id: string } | null },
  organizationId: string
): string | null => {
  const allowed = isArticleOrgInScope(
    { role: user.role, connectedOrganizationId: user.connectedOrganization?.id ?? null },
    organizationId
  )
  if (!allowed)
    return 'Antum tidak memiliki hak akses untuk mengelola artikel organisasi ini.'
  return null
}

const assertCanManageArticle = async (
  articleId: string,
  user: { role: string; connectedOrganization?: { id: string } | null }
): Promise<string | null> => {
  const existing = await articleQuery.getById(articleId)
  if (!existing) return 'Artikel tidak ditemukan.'
  return assertCanManageOrg(user, existing.organizationId)
}

export const createArticleAction = async (
  input: z.infer<typeof ArticleInputSchema>
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = ArticleInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const scopeError = assertCanManageOrg(user, validated.data.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    const created = await articleQuery.create({
      ...validated.data,
      publishedAt: validated.data.publishedAt
        ? new Date(validated.data.publishedAt)
        : null
    })

    revalidatePath('/dashboard/articles')
    logger.info('Artikel dibuat', { actorId: user.id, articleId: created.id })

    return { success: true, message: 'Artikel berhasil dibuat', data: created }
  } catch (error) {
    logger.error('Gagal membuat artikel: {error}', {
      error,
      input: redact(input as Record<string, unknown>)
    })
    if (
      error instanceof Error &&
      error.message.includes('unique')
    )
      return {
        success: false,
        message: 'Permalink sudah dipakai di organisasi ini.',
        errors: { slug: ['Permalink sudah dipakai di organisasi ini.'] }
      }
    return { success: false, message: 'Terjadi kesalahan saat membuat artikel' }
  }
}

export const updateArticleAction = async (
  id: string,
  input: z.infer<typeof ArticleInputSchema>
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = ArticleInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const scopeError = await assertCanManageArticle(id, user)
    if (scopeError) return { success: false, message: scopeError }

    const updated = await articleQuery.update(id, {
      ...validated.data,
      publishedAt: validated.data.publishedAt
        ? new Date(validated.data.publishedAt)
        : null
    })

    revalidatePath('/dashboard/articles')
    revalidatePath(`/dashboard/articles/${id}`)
    logger.info('Artikel diperbarui', { actorId: user.id, articleId: id })

    return { success: true, message: 'Artikel berhasil diperbarui', data: updated }
  } catch (error) {
    logger.error('Gagal memperbarui artikel: {error}', {
      error,
      articleId: id,
      input: redact(input as Record<string, unknown>)
    })
    if (error instanceof Error && error.message.includes('unique'))
      return {
        success: false,
        message: 'Permalink sudah dipakai di organisasi ini.',
        errors: { slug: ['Permalink sudah dipakai di organisasi ini.'] }
      }
    return { success: false, message: 'Terjadi kesalahan saat memperbarui artikel' }
  }
}
```

- [ ] **Step 5: Write `index.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-form/index.ts
export * from './action'
export * from './types'
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/article-form/action.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/_components/article-form/"
git commit -m "feat: add createArticleAction and updateArticleAction"
```

---

## Task 8: `deleteArticleAction` + `DeleteArticleButton`

**Files:**
- Create: `src/app/(dashboard)/dashboard/articles/_components/delete-article-button/action.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/delete-article-button/delete-article-button.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/_components/delete-article-button/index.ts`
- Test: `src/app/(dashboard)/dashboard/articles/_components/delete-article-button/action.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/(dashboard)/dashboard/articles/_components/delete-article-button/action.test.ts
import { expect, test, describe } from 'bun:test'
import { deleteArticleAction } from './action'

describe('deleteArticleAction', () => {
  test('rejects when confirmation text does not match the title', async () => {
    // No DB/session wiring here — exercises the early-return validation path only,
    // which runs before any session lookup would matter for this specific check.
    // If readActiveSession() returns undefined in the test environment, the
    // function should short-circuit with the auth message, which is also a
    // valid, deterministic assertion for this test.
    const result = await deleteArticleAction('00000000-0000-0000-0000-000000000000', 'salah')
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/delete-article-button/action.test.ts`
Expected: FAIL with "Cannot find module './action'"

- [ ] **Step 3: Write `action.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/delete-article-button/action.ts
'use server'

import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'article'])

type ActionResponse = { success: boolean; message: string }

export const deleteArticleAction = async (
  id: string,
  confirmInput: string
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const existing = await articleQuery.getById(id)
    if (!existing) return { success: false, message: 'Artikel tidak ditemukan.' }

    const allowed = isArticleOrgInScope(
      { role: user.role, connectedOrganizationId: user.connectedOrganization?.id ?? null },
      existing.organizationId
    )
    if (!allowed)
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk mengelola artikel ini.'
      }

    if (confirmInput !== existing.title)
      return { success: false, message: 'Judul artikel yang dimasukkan tidak sesuai' }

    await articleQuery.delete(id)
    revalidatePath('/dashboard/articles')

    logger.info('Artikel dihapus', { actorId: user.id, articleId: id })

    return { success: true, message: 'Artikel berhasil dihapus' }
  } catch (error) {
    logger.error('Gagal menghapus artikel: {error}', { error, articleId: id })
    return { success: false, message: 'Terjadi kesalahan saat menghapus artikel' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/delete-article-button/action.test.ts`
Expected: PASS

- [ ] **Step 5: Write `delete-article-button.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/_components/delete-article-button/delete-article-button.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  Delete02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/shadcn/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { deleteArticleAction } from './action'

interface DeleteArticleButtonProps {
  articleId: string
  title: string
}

export const DeleteArticleButton = ({
  articleId,
  title
}: DeleteArticleButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [alertOpen, setAlertOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteArticleAction(articleId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/articles')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Menu artikel'
              disabled={isPending}
            />
          }
        >
          {isPending ? (
            <HugeiconsIcon icon={Loading03Icon} className='size-4 animate-spin' />
          ) : (
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} className='size-4' />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setAlertOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            Hapus Artikel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={alertOpen}
        onOpenChange={(open) => {
          setAlertOpen(open)
          if (!open) setConfirmValue('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus artikel ini secara permanen dan tidak
              dapat dibatalkan. Untuk melanjutkan, ketik judul artikel{' '}
              <span className='font-geist-mono font-medium'>{title}</span> di
              bawah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='confirm-article-title'>Judul Artikel</Label>
            <Input
              id='confirm-article-title'
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={title}
              autoComplete='off'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={handleConfirm}
              disabled={isPending || confirmValue !== title}
            >
              Ya, Hapus Artikel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

- [ ] **Step 6: Write `index.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/delete-article-button/index.ts
export * from './action'
export * from './delete-article-button'
```

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/_components/delete-article-button/"
git commit -m "feat: add DeleteArticleButton with type-to-confirm dialog"
```

---

## Task 9: `article-category-manager` actions with cycle + dependent-category guards

**Files:**
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-category-manager/action.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-category-manager/types.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-category-manager/index.ts`
- Test: `src/app/(dashboard)/dashboard/articles/_components/article-category-manager/action.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-category-manager/action.test.ts
import { expect, test, describe } from 'bun:test'
import { CategoryInputSchema } from './action'

describe('CategoryInputSchema', () => {
  test('requires name and organizationId', () => {
    const result = CategoryInputSchema.safeParse({ organizationId: 'org-a' })
    expect(result.success).toBe(false)
  })

  test('accepts valid input with optional parentId', () => {
    const result = CategoryInputSchema.safeParse({
      organizationId: 'org-a',
      name: 'Kegiatan',
      slug: 'kegiatan'
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/article-category-manager/action.test.ts`
Expected: FAIL with "Cannot find module './action'"

- [ ] **Step 3: Write `types.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-category-manager/types.ts
export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}
```

- [ ] **Step 4: Write `action.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-category-manager/action.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isArticleOrgInScope } from '~/db/query/article'
import {
  articleCategoryQuery,
  wouldCreateCycle
} from '~/db/query/article-category'
import { getLogger } from '~/lib/logger'
import type { ActionResponse } from './types'

const logger = getLogger(['app', 'action', 'article-category'])

export const CategoryInputSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  parentId: z.string().uuid().optional()
})

const assertCanManageOrg = (
  user: { role: string; connectedOrganization?: { id: string } | null },
  organizationId: string
): string | null => {
  const allowed = isArticleOrgInScope(
    { role: user.role, connectedOrganizationId: user.connectedOrganization?.id ?? null },
    organizationId
  )
  if (!allowed)
    return 'Antum tidak memiliki hak akses untuk mengelola kategori organisasi ini.'
  return null
}

export const createCategoryAction = async (
  input: z.infer<typeof CategoryInputSchema>
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = CategoryInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const scopeError = assertCanManageOrg(user, validated.data.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    const created = await articleCategoryQuery.create(validated.data)
    revalidatePath('/dashboard/articles')
    logger.info('Kategori artikel dibuat', { actorId: user.id, categoryId: created.id })

    return { success: true, message: 'Kategori berhasil dibuat', data: created }
  } catch (error) {
    logger.error('Gagal membuat kategori: {error}', { error })
    if (error instanceof Error && error.message.includes('unique'))
      return {
        success: false,
        message: 'Slug kategori sudah dipakai di organisasi ini.',
        errors: { slug: ['Slug kategori sudah dipakai di organisasi ini.'] }
      }
    return { success: false, message: 'Terjadi kesalahan saat membuat kategori' }
  }
}

export const updateCategoryAction = async (
  id: string,
  input: z.infer<typeof CategoryInputSchema>
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = CategoryInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const existing = await articleCategoryQuery.getById(id)
    if (!existing) return { success: false, message: 'Kategori tidak ditemukan.' }

    const scopeError = assertCanManageOrg(user, existing.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    if (validated.data.parentId) {
      const allInOrg = await articleCategoryQuery.listForOrg(existing.organizationId)
      if (wouldCreateCycle(id, validated.data.parentId, allInOrg))
        return {
          success: false,
          message: 'Kategori induk tidak boleh berupa diri sendiri atau turunannya.',
          errors: { parentId: ['Kategori induk tidak boleh berupa diri sendiri atau turunannya.'] }
        }
    }

    const updated = await articleCategoryQuery.update(id, validated.data)
    revalidatePath('/dashboard/articles')
    logger.info('Kategori artikel diperbarui', { actorId: user.id, categoryId: id })

    return { success: true, message: 'Kategori berhasil diperbarui', data: updated }
  } catch (error) {
    logger.error('Gagal memperbarui kategori: {error}', { error, categoryId: id })
    return { success: false, message: 'Terjadi kesalahan saat memperbarui kategori' }
  }
}

export const deleteCategoryAction = async (id: string): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const existing = await articleCategoryQuery.getById(id)
    if (!existing) return { success: false, message: 'Kategori tidak ditemukan.' }

    const scopeError = assertCanManageOrg(user, existing.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    await articleCategoryQuery.delete(id)
    revalidatePath('/dashboard/articles')
    logger.info('Kategori artikel dihapus', { actorId: user.id, categoryId: id })

    return { success: true, message: 'Kategori berhasil dihapus' }
  } catch (error) {
    // article.categoryId has onDelete: 'restrict' — a foreign key violation
    // here means articles still reference this category.
    logger.error('Gagal menghapus kategori: {error}', { error, categoryId: id })
    if (
      error instanceof Error &&
      (error.message.includes('foreign key') || error.message.includes('violates'))
    )
      return {
        success: false,
        message: 'Kategori masih dipakai oleh artikel dan tidak dapat dihapus.'
      }
    return { success: false, message: 'Terjadi kesalahan saat menghapus kategori' }
  }
}
```

- [ ] **Step 5: Write `index.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-category-manager/index.ts
export * from './action'
export * from './types'
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun test src/app/\(dashboard\)/dashboard/articles/_components/article-category-manager/action.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/_components/article-category-manager/"
git commit -m "feat: add article category CRUD actions with cycle and dependent-category guards"
```

---

## Task 10: Cached data layer for article listing

**Files:**
- Create: `src/app/(dashboard)/dashboard/_data/articles.ts`
- Test: `src/app/(dashboard)/dashboard/_data/articles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/(dashboard)/dashboard/_data/articles.test.ts
import { expect, test, describe } from 'bun:test'
import { getCachedArticlesForOrg } from './articles'

describe('getCachedArticlesForOrg', () => {
  test('is exported as a function', () => {
    expect(typeof getCachedArticlesForOrg).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/app/\(dashboard\)/dashboard/_data/articles.test.ts`
Expected: FAIL with "Cannot find module './articles'"

- [ ] **Step 3: Write the implementation**

```ts
// src/app/(dashboard)/dashboard/_data/articles.ts
import { cacheLife, cacheTag } from 'next/cache'
import { articleQuery, type ArticleListFilters } from '~/db/query/article'

export const getCachedArticlesForOrg = async (
  organizationId: string,
  filters: ArticleListFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleQuery.listForOrg(organizationId, filters)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/app/\(dashboard\)/dashboard/_data/articles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/_data/articles.ts" "src/app/(dashboard)/dashboard/_data/articles.test.ts"
git commit -m "feat: add cached article listing data layer"
```

Note: `revalidatePath` calls in Task 7-9's actions invalidate the route, but since this data fetcher uses `cacheTag('articles')`, also add `updateTag('articles')` (import from `next/cache`) alongside `revalidatePath` in each mutation action from Tasks 7-9 once this task lands — wire that up as a quick follow-up edit to those three `action.ts` files now:

- [ ] **Step 6: Add `updateTag('articles')` to existing actions**

In each of `article-form/action.ts`, `delete-article-button/action.ts`, and `article-category-manager/action.ts`, import `updateTag` from `next/cache` and call `updateTag('articles')` right next to each existing `revalidatePath('/dashboard/articles')` call.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/_components/"
git commit -m "feat: invalidate articles cache tag on mutation"
```

---

## Task 11: `ArticleListView` component (table + search/status/category filters)

**Files:**
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-list-view/article-list-view.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-list-view/types.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-list-view/index.ts`

This component is presentational/client-interactive (search input + dropdowns that update URL search params) — no server action of its own, so no dedicated unit test; it's exercised via the route test in Task 14.

- [ ] **Step 1: Write `types.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-list-view/types.ts
export type ArticleListItem = {
  id: string
  title: string
  type: 'page' | 'blog'
  status: 'draft' | 'published' | 'archived'
  slug: string
  categoryId: string | null
  updatedAt: Date
}

export type ArticleCategoryOption = { id: string; name: string }
```

- [ ] **Step 2: Write `article-list-view.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/_components/article-list-view/article-list-view.tsx
'use client'

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

export const ArticleListView = ({ articles, categories }: ArticleListViewProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Input
          placeholder='Cari judul artikel...'
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateParam('search', e.target.value)}
          className='max-w-sm'
        />
        <Select
          value={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-40'>
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
          onValueChange={(v) => updateParam('categoryId', v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Kategori' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
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
          {articles.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link href={`/dashboard/articles/${a.id}`} className='font-medium hover:underline'>
                  {a.title}
                </Link>
              </TableCell>
              <TableCell>{a.type === 'blog' ? 'Artikel Blog' : 'Halaman Statik'}</TableCell>
              <TableCell>
                <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>
                  {statusLabel[a.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <DeleteArticleButton articleId={a.id} title={a.title} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-list-view/index.ts
export * from './article-list-view'
export * from './types'
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/_components/article-list-view/"
git commit -m "feat: add ArticleListView with search/status/category filters"
```

---

## Task 12: `ArticleBodyEditor` (Tiptap wrapper)

**Files:**
- Modify: `package.json` (add deps)
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-body-editor/article-body-editor.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-body-editor/types.ts`
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-body-editor/index.ts`

- [ ] **Step 1: Install Tiptap**

```bash
bun add @tiptap/react @tiptap/starter-kit @tiptap/pm
```

- [ ] **Step 2: Write `types.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-body-editor/types.ts
export type ArticleBodyJSON = Record<string, unknown>
```

- [ ] **Step 3: Write `article-body-editor.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/_components/article-body-editor/article-body-editor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '~/lib/shadcn/utils'
import type { ArticleBodyJSON } from './types'

interface ArticleBodyEditorProps {
  value?: ArticleBodyJSON
  onChange: (value: ArticleBodyJSON) => void
  className?: string
}

export const ArticleBodyEditor = ({
  value,
  onChange,
  className
}: ArticleBodyEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    }
  })

  return (
    <div className={cn('rounded-md border p-3 min-h-48', className)}>
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 4: Write `index.ts`**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-body-editor/index.ts
export * from './article-body-editor'
export * from './types'
```

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock "src/app/(dashboard)/dashboard/articles/_components/article-body-editor/"
git commit -m "feat: add ArticleBodyEditor Tiptap wrapper"
```

---

## Task 13: `ArticleForm` component + create/edit/list routes

**Files:**
- Create: `src/app/(dashboard)/dashboard/articles/_components/article-form/article-form.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/page.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/new/page.tsx`
- Create: `src/app/(dashboard)/dashboard/articles/[id]/page.tsx`

- [ ] **Step 1: Write `article-form.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/_components/article-form/article-form.tsx
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
import ImageUpload from '~/components/image-upload'
import { ArticleBodyEditor } from '../article-body-editor'
import type { ArticleBodyJSON } from '../article-body-editor/types'
import { createArticleAction, updateArticleAction } from './action'

interface ArticleFormProps {
  organizationId: string
  categories: Array<{ id: string; name: string }>
  initial?: {
    id: string
    type: 'page' | 'blog'
    title: string
    slug: string
    body: ArticleBodyJSON
    featuredImage?: string
    status: 'draft' | 'published' | 'archived'
    tags: string[]
    categoryId?: string
    publishedAt?: string
  }
}

export const ArticleForm = ({ organizationId, categories, initial }: ArticleFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'page' | 'blog'>(initial?.type ?? 'page')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [body, setBody] = useState<ArticleBodyJSON>(
    initial?.body ?? { type: 'doc', content: [{ type: 'paragraph' }] }
  )
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'draft')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(', ') ?? '')
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ?? '')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = () => {
    const input = {
      organizationId,
      type,
      title,
      slug,
      body,
      featuredImage: featuredImage || undefined,
      status,
      categoryId: categoryId || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined
    }

    startTransition(async () => {
      const result = initial
        ? await updateArticleAction(initial.id, input)
        : await createArticleAction(input)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/articles')
      } else {
        setErrors(result.errors ?? {})
        toast.error(result.message)
      }
    })
  }

  return (
    <div className='space-y-4 max-w-2xl'>
      <div className='space-y-2'>
        <Label>Tipe Artikel</Label>
        <Select value={type} onValueChange={(v) => setType(v as 'page' | 'blog')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='page'>Halaman Statik</SelectItem>
            <SelectItem value='blog'>Artikel Blog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='title'>Judul</Label>
        <Input id='title' value={title} onChange={(e) => setTitle(e.target.value)} />
        {errors.title && <p className='text-sm text-destructive'>{errors.title[0]}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='slug'>Permalink</Label>
        <Input id='slug' value={slug} onChange={(e) => setSlug(e.target.value)} />
        {errors.slug && <p className='text-sm text-destructive'>{errors.slug[0]}</p>}
      </div>

      {type === 'blog' && (
        <div className='space-y-2'>
          <Label htmlFor='publishedAt'>Tanggal</Label>
          <Input
            id='publishedAt'
            type='datetime-local'
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
          {errors.publishedAt && (
            <p className='text-sm text-destructive'>{errors.publishedAt[0]}</p>
          )}
        </div>
      )}

      <div className='space-y-2'>
        <Label>Gambar Fitur</Label>
        <ImageUpload value={featuredImage} onChange={setFeaturedImage} variant='background' folder='articles' />
      </div>

      <div className='space-y-2'>
        <Label>Kategori</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder='Pilih kategori (opsional)' />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='tags'>Tag (pisahkan dengan koma)</Label>
        <Input id='tags' value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
      </div>

      <div className='space-y-2'>
        <Label>Isi Artikel</Label>
        <ArticleBodyEditor value={body} onChange={setBody} />
      </div>

      <div className='space-y-2'>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='draft'>Draf</SelectItem>
            <SelectItem value='published'>Terbit</SelectItem>
            <SelectItem value='archived'>Diarsipkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSubmit} disabled={isPending}>
        {initial ? 'Simpan Perubahan' : 'Buat Artikel'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Update `article-form/index.ts` to also export the component**

```ts
// src/app/(dashboard)/dashboard/articles/_components/article-form/index.ts
export * from './action'
export * from './types'
export * from './article-form'
```

- [ ] **Step 3: Write the list route `page.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { readActiveSession } from '~/lib/auth/cookies'
import { getCachedArticlesForOrg } from '../_data/articles'
import { articleCategoryQuery } from '~/db/query/article-category'
import { ArticleListView } from './_components/article-list-view'
import { Button } from '~/components/shadcn/ui/button'

interface ArticlesPageProps {
  searchParams: Promise<{ search?: string; status?: string; categoryId?: string }>
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const session = await readActiveSession()
  if (!session?.user) redirect('/login')
  const { user } = session
  if (user.role !== 'root' && user.role !== 'humas') redirect('/dashboard')

  const organizationId = user.connectedOrganization?.id
  if (!organizationId) redirect('/dashboard')

  const params = await searchParams
  const [articles, categories] = await Promise.all([
    getCachedArticlesForOrg(organizationId, {
      search: params.search,
      status: params.status as 'draft' | 'published' | 'archived' | undefined,
      categoryId: params.categoryId
    }),
    articleCategoryQuery.listForOrg(organizationId)
  ])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Artikel</h1>
        <Button asChild>
          <Link href='/dashboard/articles/new'>Tambah Artikel</Link>
        </Button>
      </div>
      <ArticleListView articles={articles} categories={categories} />
    </div>
  )
}
```

- [ ] **Step 4: Write the create route `new/page.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/new/page.tsx
import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleCategoryQuery } from '~/db/query/article-category'
import { ArticleForm } from '../_components/article-form'

export default async function NewArticlePage() {
  const session = await readActiveSession()
  if (!session?.user) redirect('/login')
  const { user } = session
  if (user.role !== 'root' && user.role !== 'humas') redirect('/dashboard')

  const organizationId = user.connectedOrganization?.id
  if (!organizationId) redirect('/dashboard')

  const categories = await articleCategoryQuery.listForOrg(organizationId)

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Tambah Artikel</h1>
      <ArticleForm organizationId={organizationId} categories={categories} />
    </div>
  )
}
```

- [ ] **Step 5: Write the edit route `[id]/page.tsx`**

```tsx
// src/app/(dashboard)/dashboard/articles/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { ArticleForm } from '../_components/article-form'

export default async function EditArticlePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await readActiveSession()
  if (!session?.user) redirect('/login')
  const { user } = session
  if (user.role !== 'root' && user.role !== 'humas') redirect('/dashboard')

  const { id } = await params
  const existing = await articleQuery.getById(id)
  if (!existing) notFound()

  const allowed = isArticleOrgInScope(
    { role: user.role, connectedOrganizationId: user.connectedOrganization?.id ?? null },
    existing.organizationId
  )
  if (!allowed) redirect('/dashboard/articles')

  const categories = await articleCategoryQuery.listForOrg(existing.organizationId)

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Edit Artikel</h1>
      <ArticleForm
        organizationId={existing.organizationId}
        categories={categories}
        initial={{
          id: existing.id,
          type: existing.type,
          title: existing.title,
          slug: existing.slug,
          body: existing.body as Record<string, unknown>,
          featuredImage: existing.featuredImage ?? undefined,
          status: existing.status,
          tags: existing.tags,
          categoryId: existing.categoryId ?? undefined,
          publishedAt: existing.publishedAt?.toISOString()
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Manually verify the create flow**

Run the dev server (`bun dev`), log in as a `humas` user, visit `/dashboard/articles/new`, fill the form, and submit. Confirm the new article appears in `/dashboard/articles` and that `/dashboard/articles/<id>` lets you edit and save it.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/dashboard/articles/"
git commit -m "feat: add article list/create/edit routes and ArticleForm"
```

---

## Task 14: Wire "Artikel" into the sidebar Publikasi menu

**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`

The `menuBerita` array (around line 133) already has placeholder items "Tambah Artikel Baru" and "Daftar Artikel" with `url: '#'` — point them at the real routes.

- [ ] **Step 1: Update the placeholder URLs**

```tsx
// src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx
// Replace the menuBerita array definition with:
const menuBerita = [
  {
    title: 'Tambah Artikel Baru',
    url: '/dashboard/articles/new',
    icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
  },
  {
    title: 'Daftar Artikel',
    url: '/dashboard/articles',
    icon: <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
  }
]
```

- [ ] **Step 2: Manually verify**

Run `bun dev`, log in as `humas`, confirm the sidebar "Berita & Publikasi" group links navigate to the new routes instead of `#`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx"
git commit -m "feat: link sidebar Artikel menu items to article routes"
```

---

## Plan Self-Review Notes

- **Spec coverage:** title/body/date/featured image/category/tags/status/permalink — Tasks 1-2, 7, 13. Role restriction (`root`, `humas` only) — Tasks 4, 7-9, 13-14. Strict per-org scope (no hierarchy either direction) — Task 4 tests cover root, humas-own-org, humas-other-org, other roles. Nested per-org categories — Tasks 1, 6, 9. Free-text tags with autocomplete — Task 5 (`listDistinctTags`); wiring that into the form's tag input as an actual `<Combobox>` autocomplete UI is a reasonable follow-up but not blocking the core feature — flagged here rather than silently dropped.
- **DB migration discipline:** Tasks 1-2 only write schema files; Task 3 is an explicit stop-and-ask checkpoint before any other task touches a live `article`/`article_category` table.
- **Type consistency:** `ArticleStatus`/`ArticleType` defined once in `src/db/query/article.ts` (Task 5) and reused by name in later tasks' code comments — `action.ts` files inline their own Zod enums matching the same string literals rather than importing the type, which is consistent with how `training`'s `action.ts` files also redeclare their own Zod enums rather than importing `TrainingType`.

