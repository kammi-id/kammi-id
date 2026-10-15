import { and, asc, eq } from 'drizzle-orm'
import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organizationNotDeleted } from './organization'

export const listSitePages = async (organizationId: string) =>
  db
    .select({ id: article.id, title: article.title, slug: article.slug })
    .from(article)
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'page'),
        eq(article.status, 'published'),
        organizationNotDeleted(article.organizationId)
      )
    )
    .orderBy(asc(article.title))
