'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { Button } from '~/components/shadcn/ui/button'
import { cn } from '~/lib/shadcn/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '~/components/shadcn/ui/tooltip'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { StrukturJenjangBadge, StrukturNonAktifBadge } from '../struktur-badges'
// `import type`, tidak `import { type ... }`: berkas ini `'use client'`, dan
// `kemampuan.ts` menarik `kestrukturan.ts` yang menyentuh basis data. Bentuk
// `import type` dijamin terhapus habis, tanpa bergantung pada bundler
// mengelidasi impor yang tiap bindingnya kebetulan bertipe.
import type { StrukturKemampuan } from '~/lib/struktur/kemampuan'

export interface Organization {
  id: string
  name: string
  code: string
  slug: string
  type: string
  level: number
  parentId: string | null
  logo?: string | null
  isNonActive?: boolean
  state?: 'aktif' | 'non_aktif' | 'terhapus'
  childrenCount?: number
}

/**
 * A row as the surfaces receive it: the Struktur plus the flags the server
 * computed for it (spec §8). Grid and table take the same shape so neither can
 * grow a rule the other does not have.
 */
export type StrukturRow = Organization & { kemampuan: StrukturKemampuan }

/** Non-Aktif is read from the derived column, never reassembled from two. */
export const isNonAktif = (org: Organization): boolean =>
  org.state === 'non_aktif'

export const getColumns = (
  nameHeader: string,
  basePath: string,
  onEdit?: (org: StrukturRow) => void
): ColumnDef<StrukturRow>[] => [
  {
    accessorKey: 'name',
    header: nameHeader,
    cell: ({ row }) => {
      const org = row.original

      // Penelusuran berhenti pada Struktur Non-Aktif (spec §8.3) — dan pada PK,
      // yang tidak punya apa pun di bawahnya untuk ditelusuri.
      if (org.type === 'pk' || isNonAktif(org)) {
        return (
          <div className='text-foreground -ml-2 h-8 px-2 font-semibold'>
            {org.name}
          </div>
        )
      }

      return (
        <Link
          href={`${basePath}/${org.slug}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground -ml-2 h-8 px-2 font-semibold'
          )}
        >
          {org.name}
        </Link>
      )
    }
  },
  {
    accessorKey: 'type',
    header: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className='cursor-help'>Tipe</span>
          </TooltipTrigger>
          <TooltipContent>Tipe Organisasi (PW, PD, PK, etc.)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5'>
        <StrukturJenjangBadge type={row.original.type} />
        {isNonAktif(row.original) && <StrukturNonAktifBadge />}
      </div>
    )
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Aksi</div>,
    cell: ({ row }) => {
      // The flag, never `role`. An action column that decided for itself is
      // exactly the leak spec §8 closes.
      if (!row.original.kemampuan.sunting) return null

      return (
        <div className='text-right'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='sm'
                    className='size-8 p-0'
                    aria-label={`Kelola ${row.original.name}`}
                    onClick={() => onEdit?.(row.original)}
                  >
                    <HugeiconsIcon
                      icon={Edit01Icon}
                      strokeWidth={2}
                      className='size-4'
                    />
                  </Button>
                }
              >
                Kelola {row.original.name}
              </TooltipTrigger>
              <TooltipContent>Kelola {row.original.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  }
]
