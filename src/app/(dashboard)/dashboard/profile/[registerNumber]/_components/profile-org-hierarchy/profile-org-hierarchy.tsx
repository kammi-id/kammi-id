import React from 'react'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'

type OrgChainNode = {
  id: string
  name: string
  type: string
  code: string | null
  slug: string
  parentId: string | null
}

interface ProfileOrgHierarchyProps {
  chain: OrgChainNode[]
  currentOrgId: string
}

const orgTypeLabel: Record<string, string> = {
  pw: 'Wilayah',
  pd: 'Daerah',
  pdln: 'Daerah LN',
  pk: 'Komisariat'
}

const orgTypeBadgeClass: Record<string, string> = {
  pw: 'bg-[oklch(0.55_0.18_265/0.10)] border-[oklch(0.42_0.17_265/0.30)] text-[oklch(0.38_0.17_265)]',
  pd: 'bg-[oklch(0.58_0.20_25/0.10)] border-[oklch(0.48_0.18_25/0.30)] text-[oklch(0.42_0.18_25)]',
  pdln: 'bg-[oklch(0.58_0.20_25/0.10)] border-[oklch(0.48_0.18_25/0.30)] text-[oklch(0.42_0.18_25)]',
  pk: 'bg-[oklch(0.65_0.18_145/0.10)] border-[oklch(0.55_0.16_145/0.30)] text-[oklch(0.40_0.16_145)]'
}

export const ProfileOrgHierarchy = ({
  chain,
  currentOrgId
}: ProfileOrgHierarchyProps) => {
  if (chain.length === 0) return null

  return (
    <div>
      <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
        Struktur Organisasi
      </h2>
      <div className='flex flex-col gap-1.5'>
        {chain.map((node) => {
          const isCurrent = node.id === currentOrgId

          return (
            <div key={node.id} className='grid grid-cols-[5.5rem_1fr] items-start gap-2'>
              <span
                className={cn(
                  'font-geist-mono shrink-0 rounded border px-1 py-0.5 text-center text-[10px] font-medium',
                  orgTypeBadgeClass[node.type] ?? 'border-border text-muted-foreground'
                )}
              >
                {orgTypeLabel[node.type] ?? node.type.toUpperCase()}
              </span>
              {isCurrent ? (
                <span className='text-foreground text-xs font-semibold leading-5'>
                  {node.name}
                </span>
              ) : (
                <Link
                  href={`/dashboard/branches/${node.slug}`}
                  className='text-foreground/70 hover:text-foreground text-xs leading-5 transition-colors'
                >
                  {node.name}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
