import { db } from '../../db'
import { organization } from '../../schema/organization.sql'
import { getColumns, isNull } from 'drizzle-orm'

/**
 * The organization read primitive — and the home of the invariant in spec §7:
 * **every read filters Terhapus, and no read filters Non-Aktif.**
 *
 * The asymmetry is the rule, not an accident of this query. Terhapus is treated
 * as though the row had never been in the table (spec §1.4), while Non-Aktif
 * stays visible from inside the dashboard together with everything under it —
 * which is precisely what makes spec §8.3 legal: Kader beneath a Non-Aktif PD
 * are still read from its induk's Kader list, aggregated upward.
 *
 * It sits here rather than in each reader on purpose. A reader that has not
 * been written yet inherits the rule by going through this CTE, instead of
 * having to rediscover it — and `OrganizationFilters.state` cannot punch back
 * through it, because its type has no `'terhapus'` to pass.
 *
 * **The two deliberate exits, and there are only two:**
 *
 * - `readDeletedOrganizations` in `../organization.ts` — the single read that
 *   does the opposite, for the single surface (spec §8.4) that needs it.
 * - `withUserCTE` in `./user.ts` — Keadaan Akun is gated at the session, not
 *   here. See the comment there.
 */
export const withOrganizationCTE = db.$with('with_organization_cte').as(
  db
    .select({ ...getColumns(organization) })
    .from(organization)
    .where(isNull(organization.deletedAt))
)

export type Organization = typeof organization.$inferSelect & {
  childrenCount?: number
}
