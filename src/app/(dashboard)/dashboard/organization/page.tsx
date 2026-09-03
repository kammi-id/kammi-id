import { notFound } from 'next/navigation'
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '~/components/shadcn/ui/avatar'
import { requireOwnStrukturEditAccess } from '~/lib/auth/kestrukturan'
import { readParentOrganization } from '~/db/query/organization'
import { OrganizationProfileForm } from './_components/organization-profile-form'

/**
 * `Profil <nama Struktur>` — the one page a BPH edits its **own** Struktur from
 * (spec §8.1). `/dashboard/branches` shows the **children** of whatever it is
 * opened on, so the Edit form there always edits a child, never oneself.
 *
 * Route `/dashboard/organization`: not `user/organization`, which would claim an
 * ownership that does not exist (a Struktur is held jointly by up to four Akun),
 * and not `branches/saya`, since `branches/[[...slug]]` is an optional catch-all
 * and a static segment beside it makes two routing rules that have to be
 * remembered together.
 *
 * **Keadaan Struktur is not shown at all** — no badge, no toggle, no
 * explanation. Akun kepengurusan of a Non-Aktif Struktur stop working
 * (spec §5.4) and BPH is one of them, so this page is only ever rendered for a
 * Struktur Aktif; a badge here would show one value forever.
 */
const OrganizationProfilePage = async () => {
  // One call serves both the authorization and the page's data — the gate
  // returns the Struktur itself, so there is no second read and no window in
  // which the two could disagree. Every other Kewenangan lands on 404.
  const org = await requireOwnStrukturEditAccess()
  if (!org) notFound()

  // The only thing this page pays for: the induk's name (1 join). Everything
  // else already rides along in the session (`db/query/cte/user.ts`).
  const parent = await readParentOrganization(org)

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight'>
          Profil {org.name}
        </h1>
        <p className='text-muted-foreground leading-relaxed'>
          Kelola identitas struktur Antum sendiri.
        </p>
      </div>

      <div className='bg-card rounded-3xl border shadow-xs'>
        {/* Blok identitas — `code`, Jenjang, dan induk ditampilkan, tapi bukan
            sebagai kontrol form. Ketiganya beku selamanya untuk semua orang,
            Root termasuk, jadi input mati akan berbohong soal sebabnya. */}
        <div className='flex items-center gap-4 border-b p-6 md:p-8'>
          <Avatar className='size-14 rounded-xl'>
            <AvatarImage
              src={org.logo ? `/api/images/${org.logo}` : undefined}
              alt={`Logo ${org.name}`}
            />
            <AvatarFallback className='rounded-xl'>
              {org.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='font-heading truncate text-xl font-bold tracking-tight'>
              {org.name}
            </p>
            <p className='text-muted-foreground text-sm'>
              {org.type.toUpperCase()}
              {' · '}
              <span className='font-geist-mono text-foreground'>
                {org.code}
              </span>
            </p>
            {parent && (
              <p className='text-muted-foreground text-sm'>
                di bawah {parent.name}
              </p>
            )}
          </div>
        </div>

        <div className='p-6 md:p-8'>
          <OrganizationProfileForm
            initialData={{ name: org.name, slug: org.slug, logo: org.logo }}
          />
        </div>
      </div>
    </div>
  )
}

export default OrganizationProfilePage
