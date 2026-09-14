'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '~/components/shadcn/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/components/shadcn/ui/input-group'
import { Add01Icon, SearchIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '~/lib/shadcn/utils'
import { isNonAktif, type Organization } from '../struktur-row'
import { StrukturNonAktifBadge } from '../struktur-badges'
import { BranchManagementSheet } from '../branch-management-sheet'
import { labelJenjangAnak } from '../_jenjang-anak'

type ChildSidebarProps = {
  items: Organization[]
  childTotal: number
  /** Struktur Anak langsung tanpa memperhitungkan pencarian. */
  directChildrenTotal: number
  page: number
  /** Struktur yang sedang dibuka — induk dari apa pun yang dibuat di sini. */
  parentOrg: Organization
  /**
   * Dihitung server-side dari sel `buat` matriks (spec §8), tidak pernah
   * diturunkan di sini dari `role`.
   */
  buatAnak: boolean
  basePath: string
  /** Slot dari server: tombol "Kelola Struktur", sudah digate oleh `kemampuan`. */
  manageAction?: ReactNode
  /** Slot dari server: tombol "Reset Password", sudah digate oleh akses reset. */
  resetAction?: ReactNode
}

export const ChildSidebar = ({
  items,
  childTotal,
  directChildrenTotal,
  page,
  parentOrg,
  buatAnak,
  basePath,
  manageAction,
  resetAction
}: ChildSidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('childrenQ') ?? ''
  const [search, setSearch] = useState(query)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const pageCount = Math.ceil(childTotal / 8)

  // Dua keadaan kosong yang berbeda dan dulu memakai satu kalimat. "Tidak ada
  // yang cocok" sebelum pengguna mengetik apa pun itu kalimat yang keliru: yang
  // dibutuhkan di sana bukan kata kunci lain, melainkan Struktur Anak pertama.
  const belumAdaAnak = directChildrenTotal === 0
  // "Struktur Anak" tetap dipakai sebagai fallback untuk Jenjang tanpa anak
  // (mis. PK); dalam praktiknya kartu ini tidak pernah dirender untuk kasus
  // itu karena `showChildSidebar` sudah menyaring di pemanggil.
  const jenjangAnak = labelJenjangAnak(parentOrg.type)
  const daftarLabel = jenjangAnak ? `Daftar ${jenjangAnak}` : 'Struktur Anak'

  useEffect(() => {
    setSearch(query)
  }, [query])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const nextQuery = params.toString()
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ childrenQ: value || null, childrenPage: null })
    }, 300)
  }

  return (
    <aside className='xl:sticky xl:top-6 xl:self-start'>
      <Card>
        <CardHeader>
          <CardTitle>{daftarLabel}</CardTitle>
          <CardDescription>
            Navigasi langsung ke Struktur di bawahnya.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <InputGroup className='min-w-0 flex-1'>
              <InputGroupAddon align='inline-start'>
                <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput
                aria-label='Cari Struktur Anak'
                placeholder='Cari...'
                value={search}
                disabled={belumAdaAnak}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </InputGroup>

            {buatAnak && (
              <Button
                size='sm'
                className='shrink-0'
                onClick={() => setIsAddOpen(true)}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon='inline-start'
                />
                Tambah {jenjangAnak}
              </Button>
            )}
          </div>

          {items.length > 0 ? (
            <nav aria-label='Struktur Anak'>
              <ul className='flex flex-col gap-1'>
                {items.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`${pathname}/${child.slug}`}
                      className={cn(
                        'hover:bg-muted focus-visible:ring-ring flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2',
                        isNonAktif(child) && 'bg-muted/50 border border-dashed'
                      )}
                    >
                      {child.name}
                      {isNonAktif(child) && <StrukturNonAktifBadge />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <p className='text-muted-foreground text-sm'>
              {belumAdaAnak
                ? 'Belum ada Struktur Anak.'
                : 'Tidak ada Struktur Anak yang cocok.'}
            </p>
          )}

          {pageCount > 1 && (
            <div className='flex items-center justify-between gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => updateParams({ childrenPage: String(page - 1) })}
              >
                Sebelumnya
              </Button>
              <span className='text-muted-foreground text-sm'>
                {page} / {pageCount}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pageCount}
                onClick={() => updateParams({ childrenPage: String(page + 1) })}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(manageAction || resetAction) && (
        <Card className='mt-4'>
          <CardHeader>
            <CardTitle>Kelola Struktur</CardTitle>
            <CardDescription>
              Kelola data dan Akun Kepengurusan Struktur ini.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {manageAction}
            {resetAction}
          </CardContent>
        </Card>
      )}

      {/*
        Tidak ada `router.refresh()` di sini, dan itu disengaja: aksi
        `createOrganizationAction` memanggil `revalidatePath('/dashboard/branches',
        'layout')`, yang sudah mendorong payload RSC baru ke halaman ini —
        Struktur Anak yang baru dibuat muncul bahkan sebelum sheet ditutup.
        Diverifikasi di browser, bukan disimpulkan. Cakupan `'layout'` itu yang
        wajib: tanpanya `revalidatePath` bersifat page-scoped dan tidak pernah
        menyentuh route Struktur bersarang.
      */}
      {buatAnak && (
        <BranchManagementSheet
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          editData={null}
          addButtonLabel={jenjangAnak}
          parentOrg={parentOrg}
          basePath={basePath}
        />
      )}
    </aside>
  )
}
