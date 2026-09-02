import { notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { readDeletedMembers } from '~/db/query/member'
import { requireMemberTrashAccess, requireMemberHardDeleteAccess } from '~/lib/auth/kekaderan'
import {
  KaderTerhapusList,
  type DeletedKaderRow
} from './_components/kader-terhapus-list'
import { readHardDeleteMemberRefusal } from './_components/hard-delete-member'

/**
 * Lapis 2 (ADR 0021) — rute sendiri, bukan tab di `/dashboard/kader`.
 *
 * **Berbeda dari `/dashboard/branches/terhapus`, dan sengaja begitu**:
 * Struktur Terhapus terpusat (Root + BPW PP saja), sedangkan Kader Terhapus
 * mengikuti Cakupan — seorang BPK PD melihat dan memulihkan Kader Terhapus
 * miliknya sendiri, karena penghapusannya sendiri terdesentralisasi.
 *
 * Hapus Selamanya tetap sempit (Root + BPK PP): `canHardDelete` menyembunyikan
 * tombolnya seluruhnya untuk BPK non-PP, dan prasyaratnya (riwayat apa pun)
 * dihitung sungguhan per baris hanya ketika tombol itu ada untuk dilihat.
 */
const KaderTerhapusPage = async () => {
  const scope = await requireMemberTrashAccess()
  if (!scope) notFound()

  const [deleted, hardDeleteDenial] = await Promise.all([
    readDeletedMembers({ user: scope }),
    requireMemberHardDeleteAccess()
  ])
  const canHardDelete = !hardDeleteDenial

  const hardDeleteRefusals = canHardDelete
    ? await Promise.all(deleted.map((row) => readHardDeleteMemberRefusal(row)))
    : []

  const rows: DeletedKaderRow[] = deleted.map((row, i) => ({
    id: row.id,
    name: row.name,
    registerNumber: row.registerNumber,
    organizationName: row.organizationName,
    deletedAt: row.deletedAt.toISOString(),
    hardDeleteRefusal: canHardDelete
      ? (hardDeleteRefusals[i]?.message ?? null)
      : null
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
            Kader Terhapus
          </h1>
          <p className='text-muted-foreground leading-relaxed'>
            Catatan yang keliru, disimpan supaya bisa dibatalkan. Memulihkan
            selalu mengembalikan Kader beserta Akun login-nya.
          </p>
        </div>
      </div>

      <KaderTerhapusList rows={rows} canHardDelete={canHardDelete} />
    </div>
  )
}

export default KaderTerhapusPage
