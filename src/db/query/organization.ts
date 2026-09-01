import { db } from '../db'
import { organization } from '../schema/organization.sql'
import { member } from '../schema/member.sql'
import { user } from '../schema/user.sql'
import { article } from '../schema/article.sql'
import { articleCategory } from '../schema/article-category.sql'
import { articlePermalinkHistory } from '../schema/article-permalink-history.sql'
import { siteSettings } from '../schema/site-settings.sql'
import { withOrganizationCTE, type Organization } from './cte/organization'
export type { Organization }
import {
  inArray,
  eq,
  and,
  ilike,
  isNull,
  type SQL,
  asc,
  desc,
  count,
  sql,
  isNotNull,
  type SQLWrapper
} from 'drizzle-orm'
import { type DBExecutor } from '../types'
import { cache } from 'react'

import { createUser } from './user'
import { generatePassword, hashPassword } from '~/lib/utils/user'

/**
 * The Cakupan a read runs under: who is asking, and the Struktur their Akun
 * is connected to. Scoped reads take this as a *required* argument so that
 * skipping Cakupan is a type error rather than a silent leak.
 */
export type AccessScope = {
  role: string
  connectedOrganizationId: string | null
}

/**
 * The invariant of spec §7 in the one dialect `withOrganizationCTE` cannot
 * reach: a table that merely *points at* `organization` and never joins it.
 *
 * Give it that table's own organization-id column and it answers "does this row
 * belong to a Struktur that is not Terhapus" — Non-Aktif answers yes, because
 * Non-Aktif is never filtered. Callers put it straight into a `where`, or
 * interpolate it into a raw `sql` template; it is the same fragment either way,
 * so `article`, `training`, and `site_settings` state the rule identically
 * instead of each spelling out an `EXISTS` of its own.
 */
export const organizationNotDeleted = (
  organizationIdColumn: SQLWrapper
): SQL => sql`EXISTS (
    SELECT 1 FROM ${organization} live_org
    WHERE live_org.id = ${organizationIdColumn}
      AND live_org.deleted_at IS NULL
  )`

export const fetchAllowedOrgIds = async (user: {
  role: string
  connectedOrganization?: { id: string } | null
  connectedOrganizationId?: string | null
}): Promise<string[]> =>
  fetchAllowedOrgIdsFor(
    user.role,
    user.connectedOrganization?.id ?? user.connectedOrganizationId ?? null
  )

/**
 * The recursive walk itself, keyed on primitives so React's per-request cache
 * can actually hit. `fetchAllowedOrgIds` above takes an object, and a fresh
 * object literal per call site would miss the cache every time — several
 * places on one page ask this same question.
 *
 * **Terhapus is outside every Cakupan** (spec §7). That is stated here rather
 * than at each scoped read, and it is what carries the invariant into the reads
 * that never touch `withOrganizationCTE` at all: `readDescendantMembers`
 * intersects its `org_tree` with this list, so a Terhapus subtree drops out of
 * it without that function being patched. `requireStrukturRestoreAccess` takes
 * no target for exactly this reason — a Terhapus row is reachable by no walk.
 *
 * **Non-Aktif is inside it, and the walk does not stop there.** Kader beneath a
 * Non-Aktif PD stay readable from its induk's list (spec §8.3).
 */
const fetchAllowedOrgIdsFor = cache(
  async (role: string, connectedOrgId: string | null): Promise<string[]> => {
    if (role === 'root') {
      const result = await db
        .select({ id: organization.id })
        .from(organization)
        .where(isNull(organization.deletedAt))
      return result.map((r) => r.id)
    }

    if (!connectedOrgId) {
      return []
    }

    const userOrg = await db
      .select({ type: organization.type })
      .from(organization)
      .where(
        and(eq(organization.id, connectedOrgId), isNull(organization.deletedAt))
      )
      .limit(1)
      .then((res) => res[0])

    if (!userOrg) {
      return []
    }

    if (role === 'humas') {
      return [connectedOrgId]
    }

    try {
      const result = await db.execute(sql`
      WITH RECURSIVE org_hierarchy AS (
        SELECT id FROM ${organization}
        WHERE id = ${connectedOrgId} AND deleted_at IS NULL
        UNION ALL
        SELECT o.id FROM ${organization} o
        JOIN org_hierarchy oh ON o.parent_id = oh.id
        WHERE o.deleted_at IS NULL
      )
      SELECT id FROM org_hierarchy
    `)

      const rows = (result as any).rows || result
      const ids = (Array.isArray(rows) ? rows : []).map((r: any) => r.id)
      return ids
    } catch (error) {
      return [connectedOrgId]
    }
  }
)

type OrganizationInsertValues = typeof organization.$inferInsert

/**
 * Keadaan Struktur — satu sumbu di domain, dua kolom di simpanan (ADR 0005).
 * Ia dibaca dari kolom turunan `organization.state`, tidak pernah disusun ulang
 * dari `deleted_at` dan `is_non_active` di pemanggil. Kolomnya membuat Keadaan
 * bisa dibaca; reader di berkas ini yang membuatnya bisa disaring.
 */
export type OrganizationState = Organization['state']

/**
 * The Keadaan a normal read can ask about — Terhapus is absent, and its absence
 * is the type-level half of spec §7. `readOrganization({ state: ['terhapus'] })`
 * is a `tsc` error rather than a way around the filter in `withOrganizationCTE`,
 * so the invariant does not depend on nobody thinking of it.
 */
export type VisibleOrganizationState = Exclude<OrganizationState, 'terhapus'>

export type OrganizationFilters = {
  id?: string[]
  slug?: string
  name?: string
  type?: Organization['type'][]
  level?: number[]
  parentId?: string[] | null
  isNonActive?: boolean
  /**
   * Penanda Situs Aktif (ADR 0012). Pembaca situs publik menyaringnya
   * langsung di query — `resolveStrukturId` memakainya supaya slug tidak
   * dikenal, Struktur Terhapus, dan Situs yang belum aktif menghasilkan
   * baris kosong yang sama, tanpa membocorkan mana yang mana.
   */
  isSiteActive?: boolean
  /**
   * Menyaring Keadaan **di antara yang terlihat**. Terhapus tidak ada di
   * pilihannya: penyaringannya sudah dikerjakan `withOrganizationCTE`, dan
   * menaruhnya di sini akan jadi jalan memutarnya.
   */
  state?: VisibleOrganizationState[]
  // Pagination & Sorting
  limit?: number
  offset?: number
  orderBy?: {
    column: keyof Organization | 'childrenCount'
    direction: 'asc' | 'desc'
  }[]
}

export const createOrganization = async (
  values: OrganizationInsertValues
): Promise<
  Array<
    Organization & {
      credentials: { displayName: string; name: string; password: string }[]
    }
  >
> => {
  return await db.transaction(async (tx) => {
    const [newOrg] = await tx
      .insert(organization)
      .values({
        ...values,
        // PP mendarat dengan Situs Aktif menyala sejak lahir — ADR 0012
        // menuntut apex tidak pernah bisa mati begitu dibuat, sama seperti
        // migrasi tiket 02 menyalakannya untuk PP yang sudah ada.
        ...(values.type === 'pp' ? { isSiteActive: true } : {})
      })
      .returning({
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
        type: organization.type
      })

    const roles: Array<'bph' | 'bpk' | 'bpw' | 'humas' | 'root'> = [
      'bph',
      'bpk',
      'bpw',
      'humas'
    ]
    if (newOrg.type === 'pp') roles.push('root')

    const credentials: {
      displayName: string
      name: string
      password: string
    }[] = []

    for (const role of roles) {
      let roleDisplay = role.toUpperCase()
      let usernamePrefix: string = role

      if (role === 'bpw') {
        if (newOrg.type === 'pp') {
          roleDisplay = 'BPW'
          usernamePrefix = 'bpw'
        } else if (newOrg.type === 'pw') {
          roleDisplay = 'BPD'
          usernamePrefix = 'bpd'
        } else if (newOrg.type === 'pd' || newOrg.type === 'pdln') {
          roleDisplay = 'BPKOM'
          usernamePrefix = 'bpkom'
        } else {
          continue
        }
      }

      const username =
        role === 'root' ? 'root' : `${usernamePrefix}-${newOrg.slug}`
      const password = generatePassword()
      const passwordHash = await hashPassword(password)

      const displayName = `${roleDisplay} ${newOrg.name}`
      credentials.push({
        displayName,
        name: username,
        password
      })

      await createUser(
        {
          name: username,
          displayName,
          passwordHash,
          role,
          connectedOrganizationId: newOrg.id
        },
        tx
      )
    }

    const [org] = await tx
      .with(withOrganizationCTE)
      .select()
      .from(withOrganizationCTE)
      .where(eq(withOrganizationCTE.id, newOrg.id))

    return [{ ...org, credentials }]
  })
}

export const countOrganization = async (
  filters: OrganizationFilters = {}
): Promise<number> => {
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withOrganizationCTE.id, filters.id))
  if (filters.slug) where.push(eq(withOrganizationCTE.slug, filters.slug))
  if (filters.name)
    where.push(ilike(withOrganizationCTE.name, `%${filters.name}%`))
  if (filters.type) where.push(inArray(withOrganizationCTE.type, filters.type))
  if (filters.level)
    where.push(inArray(withOrganizationCTE.level, filters.level))
  if (filters.parentId !== undefined) {
    where.push(
      filters.parentId === null
        ? isNull(withOrganizationCTE.parentId)
        : inArray(withOrganizationCTE.parentId, filters.parentId)
    )
  }
  if (filters.isNonActive !== undefined)
    where.push(eq(withOrganizationCTE.isNonActive, filters.isNonActive))
  if (filters.isSiteActive !== undefined)
    where.push(eq(withOrganizationCTE.isSiteActive, filters.isSiteActive))
  if (filters.state)
    where.push(inArray(withOrganizationCTE.state, filters.state))

  const [result] = await db
    .with(withOrganizationCTE)
    .select({ count: count() })
    .from(withOrganizationCTE)
    .where(and(...where))

  return Number(result?.count ?? 0)
}

export const readOrganization = async (
  filters: OrganizationFilters = {},
  tx?: DBExecutor
): Promise<Array<Organization>> => {
  const executor = tx || db
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withOrganizationCTE.id, filters.id))
  if (filters.slug) where.push(eq(withOrganizationCTE.slug, filters.slug))
  if (filters.name)
    where.push(ilike(withOrganizationCTE.name, `%${filters.name}%`))
  if (filters.type) where.push(inArray(withOrganizationCTE.type, filters.type))
  if (filters.level)
    where.push(inArray(withOrganizationCTE.level, filters.level))
  if (filters.parentId !== undefined) {
    where.push(
      filters.parentId === null
        ? isNull(withOrganizationCTE.parentId)
        : inArray(withOrganizationCTE.parentId, filters.parentId)
    )
  }
  if (filters.isNonActive !== undefined)
    where.push(eq(withOrganizationCTE.isNonActive, filters.isNonActive))
  if (filters.isSiteActive !== undefined)
    where.push(eq(withOrganizationCTE.isSiteActive, filters.isSiteActive))
  if (filters.state)
    where.push(inArray(withOrganizationCTE.state, filters.state))

  const query = executor
    .with(withOrganizationCTE)
    .select({
      id: withOrganizationCTE.id,
      name: withOrganizationCTE.name,
      code: withOrganizationCTE.code,
      slug: withOrganizationCTE.slug,
      codeSlug: withOrganizationCTE.codeSlug,
      type: withOrganizationCTE.type,
      level: withOrganizationCTE.level,
      logo: withOrganizationCTE.logo,
      isSiteActive: withOrganizationCTE.isSiteActive,
      parentId: withOrganizationCTE.parentId,
      isNonActive: withOrganizationCTE.isNonActive,
      nonActiveAt: withOrganizationCTE.nonActiveAt,
      nonActiveBy: withOrganizationCTE.nonActiveBy,
      deletedAt: withOrganizationCTE.deletedAt,
      deletedBy: withOrganizationCTE.deletedBy,
      state: withOrganizationCTE.state,
      // Anak Terhapus tidak dihitung — konsisten dengan spec §3 klausa 2, yang
      // menyatakan anak Terhapus tidak menahan penghapusan induknya. Angka di
      // sini dan prasyarat di sana wajib menghitung kumpulan yang sama.
      //
      // The inner table is aliased and **both sides are qualified** because
      // `${withOrganizationCTE.id}` renders as a bare `"id"` inside a raw `sql`
      // template — only `.where()` qualifies it — and a bare `"id"` binds to
      // the subquery's own scope. That made the predicate `parent_id = id`,
      // which is true of no row, so this count read 0 for every Struktur.
      childrenCount: sql`
        (SELECT count(*) FROM ${organization} child
         WHERE child.parent_id = ${withOrganizationCTE}.id
           AND child.deleted_at IS NULL)
      `.mapWith(Number)
    })
    .from(withOrganizationCTE)
    .where(and(...where))

  if (filters.orderBy && filters.orderBy.length > 0) {
    const orderClauses = filters.orderBy.map(({ column, direction }) => {
      const orderFn = direction === 'asc' ? asc : desc
      if (column === 'childrenCount') {
        return orderFn(sql`children_count`)
      }
      return orderFn(
        withOrganizationCTE[column as keyof typeof withOrganizationCTE] as any
      )
    })
    query.orderBy(...orderClauses)
  } else {
    // Default: type priority (pw → pdln → pd → pk), then numeric code order
    query.orderBy(
      sql`CASE ${withOrganizationCTE.type}
        WHEN 'pp' THEN 0
        WHEN 'pw' THEN 1
        WHEN 'pdln' THEN 2
        WHEN 'pd' THEN 3
        WHEN 'pk' THEN 4
        ELSE 5
      END`,
      sql`(substring(${withOrganizationCTE.code} from '[0-9]+'))::int`,
      asc(withOrganizationCTE.code)
    )
  }

  if (filters.limit !== undefined) {
    query.limit(filters.limit)
  }

  if (filters.offset !== undefined) {
    query.offset(filters.offset)
  }

  return await query
}

/**
 * The cursor a keyset page hands back so the caller can ask for the next one:
 * the sort key's value on the last row it returned, paired with that row's
 * `id` as the tie-break.
 */
export type OrganizationKeysetCursor = {
  total: number
  id: string
}

/**
 * Filters `readOrganizationsByMemberTotal` accepts — a narrower set than
 * `OrganizationFilters`, on purpose: this read has exactly one caller shape
 * (Daftar Struktur, tiket 06), a single `parentId` rather than a list, and no
 * `limit`/`offset`/`orderBy` — those are replaced by `pagination` below.
 */
export type OrganizationMemberTotalFilters = {
  parentId: string
  name?: string
  type?: Organization['type'][]
  /** Same three flags `readMemberAggregates` takes — kept identical on
   * purpose, so a card's displayed `total` and the order it appears in are
   * counting the same members. */
  isAlumn?: boolean
  isCertifiedMentor?: boolean
  isCertifiedInstructor?: boolean
}

export type OrganizationWithMemberTotal = Organization & {
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  total: number
}

/**
 * Daftar Struktur, satu jenjang di bawah `parentId`, diurut `total DESC, id
 * ASC` lewat keyset — bukan `LIMIT/OFFSET` (tiket 06).
 *
 * **Kenapa keyset, bukan offset.** Daftar ini diurut oleh angka yang berubah
 * tiap ada Kader baru masuk. `OFFSET N` menghitung baris dari nol tiap
 * dipanggil; kalau satu Struktur melompat naik peringkat di antara dua
 * panggilan, baris di sekitar potongan itu bisa terlewat atau muncul dua
 * kali — diam-diam, tanpa error. Keyset tidak menghitung posisi sama sekali:
 * `pagination.cursor` menyimpan **nilai** baris terakhir yang sudah dikirim
 * (`total`, `id`), dan baris berikutnya disaring dengan bandingan nilai
 * (`total < cursor.total OR (total = cursor.total AND id > cursor.id)`).
 * Baris yang sudah lewat tidak bisa terhitung ulang oleh baris yang baru
 * masuk, sebab predikatnya tidak pernah menghitung — ia membandingkan.
 *
 * **`total` bukan kolom** — ia agregat rekursif: jumlah Kader (tersaring
 * lewat tiga flag di atas) di seluruh sub-pohon tiap anak langsung, persis
 * cara `readMemberAggregates` menggulungnya dari bawah ke atas, hanya saja di
 * sini satu query SQL per jenjang lewat CTE rekursif `org_tree`, bukan
 * rekursi + gulung di JavaScript — sebab tiap baris di sini butuh angkanya
 * sebelum baris itu bisa diurut atau disaring oleh `cursor`, dan tidak ada
 * cara mengurutkan lewat SQL dengan angka yang baru dihitung setelah SQL
 * selesai.
 *
 * `pagination.limit` diambil apa adanya — pemanggil yang ingin tahu apakah
 * masih ada baris berikutnya (untuk "Muat lagi") meminta `limit + 1` dan
 * memotong sendiri, sama seperti pola di `action.ts` `members-grid`.
 */
export const readOrganizationsByMemberTotal = async (
  filters: OrganizationMemberTotalFilters,
  pagination: { limit: number; cursor?: OrganizationKeysetCursor }
): Promise<OrganizationWithMemberTotal[]> => {
  const { parentId, name, type, isAlumn, isCertifiedMentor, isCertifiedInstructor } =
    filters
  const { limit, cursor } = pagination

  const rows = await db.execute(sql`
    WITH RECURSIVE org_tree AS (
      SELECT id, parent_id, id AS root_id
      FROM ${organization}
      WHERE parent_id = ${parentId} AND deleted_at IS NULL
      UNION ALL
      SELECT o.id, o.parent_id, ot.root_id
      FROM ${organization} o
      JOIN org_tree ot ON o.parent_id = ot.id
      WHERE o.deleted_at IS NULL
    ),
    aggregates AS (
      SELECT
        ot.root_id AS organization_id,
        count(*) FILTER (WHERE m.status = 'ab1')::int AS ab1,
        count(*) FILTER (WHERE m.status = 'ab2')::int AS ab2,
        count(*) FILTER (WHERE m.status = 'ab3')::int AS ab3,
        count(*) FILTER (WHERE m.gender = 'ikhwan')::int AS ikhwan,
        count(*) FILTER (WHERE m.gender = 'akhwat')::int AS akhwat,
        count(m.id)::int AS total
      FROM org_tree ot
      LEFT JOIN ${member} m ON m.organization_id = ot.id
        AND m.deleted_at IS NULL
        AND m.is_suspended = false
        ${isAlumn !== undefined ? sql`AND m.is_alumn = ${isAlumn}` : sql``}
        ${isCertifiedMentor !== undefined ? sql`AND m.is_certified_mentor = ${isCertifiedMentor}` : sql``}
        ${isCertifiedInstructor !== undefined ? sql`AND m.is_certified_instructor = ${isCertifiedInstructor}` : sql``}
        ${isAlumn === false ? sql`AND m.is_non_active = false` : sql``}
      GROUP BY ot.root_id
    )
    SELECT
      o.id,
      o.name,
      o.code,
      o.slug,
      o.code_slug AS "codeSlug",
      o.type,
      o.level,
      o.logo,
      o.is_site_active AS "isSiteActive",
      o.parent_id AS "parentId",
      o.is_non_active AS "isNonActive",
      o.non_active_at AS "nonActiveAt",
      o.non_active_by AS "nonActiveBy",
      o.deleted_at AS "deletedAt",
      o.deleted_by AS "deletedBy",
      o.state,
      (SELECT count(*) FROM ${organization} child
       WHERE child.parent_id = o.id AND child.deleted_at IS NULL)::int AS "childrenCount",
      COALESCE(a.ab1, 0) AS ab1,
      COALESCE(a.ab2, 0) AS ab2,
      COALESCE(a.ab3, 0) AS ab3,
      COALESCE(a.ikhwan, 0) AS ikhwan,
      COALESCE(a.akhwat, 0) AS akhwat,
      COALESCE(a.total, 0) AS total
    FROM ${organization} o
    LEFT JOIN aggregates a ON a.organization_id = o.id
    WHERE o.parent_id = ${parentId}
      AND o.deleted_at IS NULL
      ${name ? sql`AND o.name ILIKE ${`%${name}%`}` : sql``}
      ${
        type && type.length > 0
          ? sql`AND o.type IN (${sql.join(
              type.map((t) => sql`${t}`),
              sql`, `
            )})`
          : sql``
      }
      ${
        cursor
          ? sql`AND (COALESCE(a.total, 0) < ${cursor.total}
                OR (COALESCE(a.total, 0) = ${cursor.total} AND o.id > ${cursor.id}))`
          : sql``
      }
    ORDER BY COALESCE(a.total, 0) DESC, o.id ASC
    LIMIT ${limit}
  `)

  const result = rows as unknown as OrganizationWithMemberTotal[]
  return result.map((row) => ({
    ...row,
    ab1: Number(row.ab1),
    ab2: Number(row.ab2),
    ab3: Number(row.ab3),
    ikhwan: Number(row.ikhwan),
    akhwat: Number(row.akhwat),
    total: Number(row.total)
  }))
}

/**
 * The induk of a Struktur, or null when it has none.
 *
 * **`null` is two answers wearing one shape, and both callers want the same
 * thing done about it.** It means "this Struktur is the root of the tree" when
 * `parentId` is null, and it means "the induk is Terhapus" when `parentId` is
 * set but the read invariant (spec §7) drops the row. Every rule that consults
 * an induk refuses a dead one, so collapsing the two here is safe — and it is
 * why callers are handed `parentId` alongside, so a rule that ever needs to
 * tell them apart still can.
 */
export const readParentOrganization = async (org: {
  parentId: string | null
}): Promise<Organization | null> => {
  if (!org.parentId) return null
  const [parent] = await readOrganization({ id: [org.parentId] })
  return parent ?? null
}

/**
 * Marks a Struktur Non-Aktif, with its trace — **the columns it names and no
 * others.** Narrow for the same reason `moveOrganizationParent` is: a write
 * that can only ever carry these three cannot quietly grow a fourth.
 *
 * `deleted_at` is untouched. So is `parent_id`: children already Non-Aktif stay
 * where they are (spec §6.4).
 */
export const deactivateOrganization = async (
  id: string,
  actorId: string
): Promise<void> => {
  await db
    .update(organization)
    .set({ isNonActive: true, nonActiveAt: new Date(), nonActiveBy: actorId })
    .where(eq(organization.id, id))
}

/**
 * Clears Non-Aktif and its trace. The exact inverse of the above, and nothing
 * else — reviving an induk does **not** revive its children (spec §6.4): an
 * unrequested mass state change is the fastest way to wake up Struktur that
 * were deliberately put to sleep.
 */
export const reactivateOrganization = async (id: string): Promise<void> => {
  await db
    .update(organization)
    .set({ isNonActive: false, nonActiveAt: null, nonActiveBy: null })
    .where(eq(organization.id, id))
}

/**
 * Deletes a Struktur — **always soft, and there is no other kind** (ADR 0004).
 * Since tiket 13 the database itself guarantees it: every FK into
 * `organization` is NO ACTION, so a hard `DELETE` fails with `23503`.
 *
 * **`is_non_active` is deliberately not swept.** Terhapus dominates Non-Aktif,
 * but dominating is not erasing: a Struktur that was Non-Aktif and then deleted
 * keeps `is_non_active` lit, and that is correct — the derived `state` column
 * already answers which one wins.
 */
export const softDeleteOrganization = async (
  id: string,
  actorId: string
): Promise<void> => {
  await db
    .update(organization)
    .set({ deletedAt: new Date(), deletedBy: actorId })
    .where(eq(organization.id, id))
}

/**
 * ALL rows with this parent — every Keadaan, Terhapus termasuk. Beda dari
 * `childrenCount` di `readOrganization`, yang sengaja mengecualikan anak
 * Terhapus mengikuti prasyarat penghapusan biasa (spec §3 klausa 2).
 *
 * Prasyarat Hapus Selamanya (ADR 0019) tidak punya opsi mengecualikan: anak
 * dalam Keadaan apa pun tetap memegang `parent_id` yang menunjuk baris yang
 * mau lenyap, dan FK akan menolak persis karena itu.
 */
export const countAllChildrenByOrganization = async (
  id: string
): Promise<number> => {
  const [row] = await db
    .select({ total: count() })
    .from(organization)
    .where(eq(organization.parentId, id))

  return Number(row?.total ?? 0)
}

/**
 * Berapa baris Publikasi (Artikel, Kategori Artikel, riwayat Permalink-nya,
 * Pengaturan Situs) yang masih menunjuk Struktur ini — separuh lain dari
 * prasyarat Hapus Selamanya (ADR 0019), yang sengaja **tidak** dimiliki
 * `checkDeletion` biasa (spec §3 menyatakan Publikasi boleh menggantung).
 *
 * Hard delete tidak punya opsi menggantung: keempat tabelnya NOT NULL, NO
 * ACTION ke `organization.id` sejak tiket 13, jadi baris yang tersisa membuat
 * penghapusan gagal dengan `23503` mentah alih-alih pesan yang bisa dibaca.
 */
export const countPublikasiByOrganization = async (
  id: string
): Promise<number> => {
  const [articleRow] = await db
    .select({ total: count() })
    .from(article)
    .where(eq(article.organizationId, id))
  const [categoryRow] = await db
    .select({ total: count() })
    .from(articleCategory)
    .where(eq(articleCategory.organizationId, id))
  const [permalinkRow] = await db
    .select({ total: count() })
    .from(articlePermalinkHistory)
    .where(eq(articlePermalinkHistory.organizationId, id))
  const [siteSettingsRow] = await db
    .select({ total: count() })
    .from(siteSettings)
    .where(eq(siteSettings.organizationId, id))

  return (
    Number(articleRow?.total ?? 0) +
    Number(categoryRow?.total ?? 0) +
    Number(permalinkRow?.total ?? 0) +
    Number(siteSettingsRow?.total ?? 0)
  )
}

/**
 * Menghapus baris Struktur Terhapus dari basis data sungguhan — **satu-satunya
 * pengecualian ADR 0004, dan hanya lewat gerbang `checkHardDeletion`** (ADR
 * 0019), yang menutup persis lubang yang membuat ADR 0004 menolak hard delete
 * Struktur kosong: nol Kader SELAMANYA (bukan cuma nol yang hidup) dan nol anak
 * dalam Keadaan apa pun. Pemanggil wajib memeriksa gerbang itu **sebelum**
 * memanggil ini — fungsi ini sendiri tidak mengulang pemeriksaan, sama seperti
 * `softDeleteOrganization` tidak mengulang `checkDeletion`.
 *
 * Akun kepengurusan yang terhubung ikut terhapus di transaksi yang sama —
 * bukan cascade skema (ADR 0004 mencabutnya justru supaya ini tidak pernah
 * terjadi *diam-diam*), melainkan langkah yang disengaja di jalur yang sudah
 * lolos gerbangnya sendiri.
 */
export const hardDeleteOrganization = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx.delete(user).where(eq(user.connectedOrganizationId, id))
    await tx.delete(organization).where(eq(organization.id, id)) // ADR_0019_SANCTIONED_HARD_DELETE
  })
}

/**
 * Brings a Struktur Terhapus back — **and it always lands on Aktif**
 * (spec §8.4).
 *
 * It clears **both** columns, and that is the whole of the decision: a Struktur
 * that was Non-Aktif, then deleted, then restored comes back Aktif rather than
 * Non-Aktif. Terhapus → Non-Aktif is a transition that never exists (spec §1.5),
 * so leaving `is_non_active` lit would resurrect a Keadaan nobody chose. That is
 * the exact opposite of `softDeleteOrganization`, which deliberately does *not*
 * sweep `is_non_active` — deleting dominates, restoring decides.
 *
 * **The `*_by` half of each pair goes with it, and that is a decision.**
 * Spec §1.5 names two columns; §1.6 installs `deleted_by`/`non_active_by`
 * alongside them as a trace. Clearing `deleted_at` while leaving `deleted_by`
 * set would leave the row asserting "deleted by X" about a Struktur that is not
 * deleted — a dangling fact, not a record. The trace here is **current state,
 * not history**: `reactivateOrganization` already clears `non_active_by` for
 * exactly this reason, and restoring is the same move on the other axis. A
 * repo that wants who-deleted-what kept after a restore needs a history table,
 * which spec §1.6 explicitly declines ("bukan tabel riwayat penuh").
 *
 * `slug` is written only when the caller passes one, which happens when the old
 * slug has since been claimed and a person picked a new one in the dialog. It
 * is never rewritten silently.
 *
 * Restoring does **not** cascade to descendants. A Terhapus-beneath-Terhapus
 * chain is restored from the top down, one row at a time, by a surface that
 * shows the order (spec §8.4).
 */
export const restoreOrganization = async (
  id: string,
  slug?: string
): Promise<void> => {
  await db
    .update(organization)
    .set({
      deletedAt: null,
      deletedBy: null,
      isNonActive: false,
      nonActiveAt: null,
      nonActiveBy: null,
      ...(slug ? { slug } : {})
    })
    .where(eq(organization.id, id))
}

/**
 * Moves one or more Struktur beneath a new induk — **one column, one
 * statement, zero other rows.**
 *
 * It is deliberately not `updateOrganization({ parentId }, id)`: that takes a
 * whole values object, and a move that can only ever carry `parentId` is a move
 * that cannot quietly grow a second field. `member.organizationId` and
 * `training.organizationId` both point at the Komisariat rather than at its
 * induk, so Kader and Daurah do not travel and there is nothing else to update.
 *
 * The plural signature serves the bulk shortcut ("pindahkan semua Komisariat
 * Aktif ke PW") without a second function or a loop of round trips.
 */
export const moveOrganizationParent = async (
  ids: string[],
  newParentId: string
): Promise<void> => {
  if (ids.length === 0) return
  await db
    .update(organization)
    .set({ parentId: newParentId })
    .where(inArray(organization.id, ids))
}

/**
 * Reads the row back from `organization` directly rather than through
 * `withOrganizationCTE`, and that is deliberate: an update must return what it
 * just wrote. Going through the CTE would make a write that sets `deleted_at`
 * — the soft delete of spec §1.2 — return an empty array, and a caller would
 * read that as failure. The read invariant governs reads; this is the echo of a
 * write.
 */
export const updateOrganization = async (
  values: Partial<OrganizationInsertValues>,
  id: string
): Promise<Array<Organization>> => {
  return await db.transaction(async (tx) => {
    await tx.update(organization).set(values).where(eq(organization.id, id))

    return await tx.select().from(organization).where(eq(organization.id, id))
  })
}

/**
 * The single read that does the opposite of spec §7 — **Terhapus and nothing
 * else** — for the single surface that needs it (`/dashboard/branches/terhapus`,
 * spec §8.4), gated by `requireStrukturRestoreAccess`.
 *
 * Kept as its own function rather than a flag on `readOrganization` on purpose.
 * A flag is reachable from every call site that already reads Struktur, and a
 * role-based filter on `/dashboard/branches` would punch the hole through the
 * most-read page in the dashboard. One function, one caller, one surface: the
 * blast radius of getting this wrong is the size of the recycle bin.
 *
 * `parentId` is carried because a restore has to happen top-down and the induk
 * is what states the order (spec §8.4).
 *
 * ## Why it takes no `AccessScope`, against the rule in AGENTS.md
 *
 * "Cakupan is a required argument, never an optional one" governs **scoped**
 * reads, and this read cannot be one: a Terhapus row is outside every Cakupan
 * by construction — `fetchAllowedOrgIdsFor` strips it from all of them — so a
 * scope passed here would have nothing to narrow. `requireStrukturRestoreAccess`
 * takes no target for the identical reason, and the two roles that hold
 * `pulihkan` at all (Root, and BPW whose Struktur is PP) both reach the whole
 * country, so the argument would be a provable no-op rather than a guard.
 *
 * What actually stands between this function and a caller is therefore the gate
 * alone. That is a weaker pairing than a required parameter, and it is stated
 * here rather than left to be discovered: **call this only behind
 * `requireStrukturRestoreAccess`.**
 */
export const readDeletedOrganizations = async (
  filters: { id?: string[] } = {}
): Promise<Array<Organization>> => {
  const where: SQL[] = [isNotNull(organization.deletedAt)]
  if (filters.id) {
    if (filters.id.length === 0) return []
    where.push(inArray(organization.id, filters.id))
  }

  return await db
    .select()
    .from(organization)
    .where(and(...where))
    .orderBy(desc(organization.deletedAt))
}

type OrgChainNode = {
  id: string
  name: string
  type: string
  code: string | null
  slug: string
  parentId: string | null
}

/**
 * Whether a Struktur falls inside a Cakupan — purely a question of reach.
 * It does not ask what the Akun may *do* once there; that is the caller's
 * gate to name. `isOrgInScope` below answers the narrower "may this Akun
 * manage it", which folds in a BPK requirement and so is wrong for reads.
 */
export const isOrgInAccessScope = async (
  scope: AccessScope,
  targetOrgId: string
): Promise<boolean> => {
  if (scope.role === 'root') return true
  const allowedIds = await fetchAllowedOrgIds(scope)
  return allowedIds.includes(targetOrgId)
}

export const isOrgInScope = async (
  user: {
    role: string
    connectedOrganization?: { id: string } | null
    connectedOrganizationId?: string | null
  },
  targetOrgId: string
): Promise<boolean> => {
  if (user.role === 'root') return true
  if (user.role !== 'bpk') return false
  const allowedIds = await fetchAllowedOrgIds(user)
  return allowedIds.includes(targetOrgId)
}

/**
 * Walks `parent_id` upward. The chain **stops at a Terhapus ancestor** rather
 * than stepping over it: a breadcrumb that skipped the gap would state a
 * lineage that does not exist, which is a louder lie than a short chain.
 */
export const readOrgHierarchyChain = async (
  orgId: string
): Promise<OrgChainNode[]> => {
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, type, code, slug, parent_id
      FROM organization
      WHERE id = ${orgId} AND deleted_at IS NULL
      UNION ALL
      SELECT o.id, o.name, o.type, o.code, o.slug, o.parent_id
      FROM organization o
      JOIN ancestors a ON o.id = a.parent_id
      WHERE o.deleted_at IS NULL
    )
    SELECT id, name, type, code, slug, parent_id as "parentId"
    FROM ancestors
    WHERE type != 'pp'
    ORDER BY
      CASE type
        WHEN 'pw' THEN 1
        WHEN 'pdln' THEN 2
        WHEN 'pd' THEN 3
        WHEN 'pk' THEN 4
        ELSE 5
      END ASC
  `)

  const rows = result as unknown as OrgChainNode[]
  return rows
}
