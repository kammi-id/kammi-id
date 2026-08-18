import { notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import {
  readDeletedOrganizations,
  readOrganization
} from '~/db/query/organization'
import { requireStrukturRestoreAccess } from '~/lib/auth/kestrukturan'
import {
  StrukturTerhapusList,
  type DeletedStrukturRow
} from './_components/struktur-terhapus-list'

/**
 * The Struktur Terhapus surface (spec §8.4) — **its own route, not a filter on
 * `/dashboard/branches`.**
 *
 * It leans on the read invariant of spec §7: every read filters Terhapus. The
 * safest way to keep that invariant is exactly **one** read function that
 * deliberately does the opposite, used by exactly **one** surface. A role-based
 * filter on `/dashboard/branches` would punch the hole through the most-read
 * page in the dashboard, and a hole in the busiest surface is the costly kind.
 *
 * For **Root and BPW PP**, and the gate is the easiest one in the repo to get
 * wrong: it is not `role === 'root'`, and it is not
 * `role === 'root' || role === 'bpw'`. `requireStrukturRestoreAccess` derives
 * the answer from the matrix so BPW PD's empty `pulihkan` cell cannot drift.
 */
const StrukturTerhapusPage = async () => {
  const denial = await requireStrukturRestoreAccess()
  if (denial) notFound()

  const deleted = await readDeletedOrganizations()

  // The old induk is not decoration — it is what states the order a chain has
  // to be restored in, so it is read for every row. An induk that is itself
  // Terhapus is on this same page, hence both lookups.
  const parentIds = [
    ...new Set(
      deleted
        .map((org) => org.parentId)
        .filter((id): id is string => id !== null)
    )
  ]
  const [liveParents, deletedParents] =
    parentIds.length > 0
      ? await Promise.all([
          readOrganization({ id: parentIds }),
          readDeletedOrganizations({ id: parentIds })
        ])
      : [[], []]

  const nameById = new Map(
    [...liveParents, ...deletedParents].map((org) => [org.id, org.name])
  )

  const rows: DeletedStrukturRow[] = deleted.map((org) => ({
    id: org.id,
    name: org.name,
    code: org.code,
    type: org.type,
    parentName: org.parentId ? (nameById.get(org.parentId) ?? null) : null
  }))

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-muted text-muted-foreground ring-muted/50 flex size-14 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
            className='size-7'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Struktur Terhapus
          </h1>
          <p className='text-muted-foreground leading-relaxed'>
            Catatan yang keliru, disimpan supaya bisa dibatalkan. Memulihkan
            selalu mengembalikannya sebagai Aktif.
          </p>
        </div>
      </div>

      <StrukturTerhapusList rows={rows} />
    </div>
  )
}

export default StrukturTerhapusPage
