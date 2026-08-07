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
      .references(() => organization.id),
    type: t.text({ enum: ['page', 'blog'] }).notNull(),
    title: t.text().notNull(),
    slug: t.text().notNull(),
    body: t.jsonb().notNull(),
    featuredImage: t.text('featured_image'),
    publishedAt: t.timestamp('published_at'),
    status: t
      .text({ enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    tags: t
      .text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
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
