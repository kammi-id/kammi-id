'use client'

import { type StrukturRow, isNonAktif } from '../branches-table/columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit01Icon, ChevronRight } from '@hugeicons/core-free-icons'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { StrukturJenjangBadge, StrukturNonAktifBadge } from '../struktur-badges'

interface BranchCardProps {
  org: StrukturRow
  basePath: string
  onEdit: (org: StrukturRow) => void
}

export const BranchCard = ({ org, basePath, onEdit }: BranchCardProps) => {
  const nonAktif = isNonAktif(org)

  return (
    <div
      className={cn(
        'group border-border bg-card relative flex flex-col justify-between rounded-lg border p-5 transition-all',
        // Redup lewat permukaan dan garis, bukan lewat opasitas teks: kontras
        // teksnya wajib tetap lolos WCAG AA (spec §8.3, PRODUCT.md).
        nonAktif
          ? 'bg-muted/50 border-dashed'
          : 'hover:border-primary/50 hover:shadow-sm'
      )}
    >
      <div className='space-y-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-1.5'>
            <StrukturJenjangBadge type={org.type} />
            {nonAktif && <StrukturNonAktifBadge />}
          </div>
          {org.kemampuan.sunting && (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 shrink-0 p-0 opacity-30 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
              aria-label={`Kelola ${org.name}`}
              onClick={() => onEdit(org)}
            >
              <HugeiconsIcon
                icon={Edit01Icon}
                strokeWidth={2}
                className='text-muted-foreground size-4'
              />
            </Button>
          )}
        </div>
        <div>
          {/* Penelusuran berhenti pada Struktur Non-Aktif (spec §8.3): tautan
              dan chevron mati, bukan sekadar diredupkan. Di bawahnya tidak
              pernah ada Struktur Aktif, dan menghidupkan anak menuntut induknya
              hidup lebih dulu — jadi tidak ada alur perbaikan yang menuntut
              masuk ke dalamnya. */}
          {nonAktif ? (
            <span className='text-foreground font-semibold'>{org.name}</span>
          ) : (
            <Link
              href={`${basePath}/${org.slug}`}
              className='group/link flex items-center justify-between gap-1'
            >
              <span className='text-foreground group-hover/link:text-primary font-semibold transition-colors'>
                {org.name}
              </span>
              <HugeiconsIcon
                icon={ChevronRight}
                strokeWidth={2}
                className='text-muted-foreground size-4 transition-transform group-hover/link:translate-x-1'
              />
            </Link>
          )}
        </div>
      </div>
      <div className='border-border/50 mt-6 flex items-center justify-between border-t pt-4'>
        <div className='flex flex-col'>
          <span className='text-muted-foreground text-[10px] font-medium tracking-tight uppercase'>
            Kode
          </span>
          <span className='text-foreground font-mono text-xs'>{org.code}</span>
        </div>
        {org.childrenCount !== undefined && org.childrenCount > 0 && (
          <div className='flex flex-col text-right'>
            <span className='text-muted-foreground text-[10px] font-medium tracking-tight uppercase'>
              Sub-struktur
            </span>
            <span className='text-foreground text-xs'>{org.childrenCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
