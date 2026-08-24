'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
import { SearchIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Organization } from '~/db/query/organization'

type ChildSidebarProps = {
  items: Organization[]
  childTotal: number
  page: number
}

export const ChildSidebar = ({
  items,
  childTotal,
  page
}: ChildSidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('childrenQ') ?? ''
  const [search, setSearch] = useState(query)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const pageCount = Math.ceil(childTotal / 8)

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
          <CardTitle>Struktur Anak</CardTitle>
          <CardDescription>
            Navigasi langsung ke Struktur di bawahnya.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <InputGroup>
            <InputGroupAddon align='inline-start'>
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              aria-label='Cari Struktur Anak'
              placeholder='Cari Struktur Anak...'
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </InputGroup>

          {items.length > 0 ? (
            <nav aria-label='Struktur Anak'>
              <ul className='flex flex-col gap-1'>
                {items.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`${pathname}/${child.slug}`}
                      className='hover:bg-muted focus-visible:ring-ring flex rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2'
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <p className='text-muted-foreground text-sm'>
              Tidak ada Struktur Anak yang cocok.
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
    </aside>
  )
}
