import { resolveStrukturHost } from '~/lib/struktur/tenant-host'
import type { PWOrg } from '~/app/(main)/_data/network'

type JaringanLinksSectionProps = {
  pwOrgs: PWOrg[]
}

/**
 * Tautan internal ke setiap Situs Wilayah Aktif — ticket 05: "Sitemap saja
 * lemah untuk situs baru; tautan internal yang mengalirkan otoritas ke bawah
 * pohon." Beranda PP sudah punya "Berita KAMMI se-Indonesia", tapi itu cuma
 * menautkan Struktur yang kebetulan sedang punya Berita terbit — sebuah PW
 * yang baru menyalakan Situsnya dan belum sempat menerbitkan apa pun tidak
 * pernah muncul di sana. Daftar ini menautkan berdasarkan Situs Aktif,
 * bukan aktivitas Berita, supaya situs baru tetap tertelusuri sejak hari
 * pertama.
 *
 * Anak PP langsung (PW) saja, bukan seluruh pohon (PD/PDLN/PK) — cakupan
 * yang sama dipertimbangkan cukup untuk mengalirkan otoritas ke lapisan
 * berikutnya; PD/PDLN/PK punya tautan internal dari halaman PW-nya sendiri
 * begitu ticket serupa dikerjakan di sana.
 */
export const JaringanLinksSection = ({ pwOrgs }: JaringanLinksSectionProps) => {
  const activeOrgs = pwOrgs.filter(
    (org) => org.isSiteActive && !org.isNonActive
  )
  if (activeOrgs.length === 0) return null

  return (
    <section
      className='bg-background border-border/60 border-t py-12'
      aria-labelledby='jaringan-links-heading'
    >
      <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
        <h2
          id='jaringan-links-heading'
          className='text-muted-foreground font-sans text-xs font-semibold tracking-widest uppercase'
        >
          Situs Wilayah KAMMI
        </h2>
        <ul className='mt-4 flex flex-wrap gap-x-6 gap-y-2' role='list'>
          {activeOrgs.map((org) => (
            <li key={org.id}>
              <a
                href={`https://${resolveStrukturHost(org)}`}
                className='text-muted-foreground hover:text-foreground font-sans text-sm transition-colors'
              >
                {org.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
