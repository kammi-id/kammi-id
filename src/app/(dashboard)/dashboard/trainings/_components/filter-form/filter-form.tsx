'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Button } from '~/components/shadcn/ui/button'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface FilterFormProps {
  initialOrganizationId?: string
  initialYear?: string
  organizations: { id: string; name: string }[]
}

export const FilterForm = ({
  initialOrganizationId,
  initialYear,
  organizations
}: FilterFormProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  return (
    <div className='flex flex-wrap items-end gap-4'>
      <div className='grid w-full max-w-sm items-center gap-1.5'>
        <Label>Organisasi</Label>
        <Select
          value={initialOrganizationId}
          onValueChange={(val) => updateFilter('organizationId', val ?? '')}
        >
          <SelectTrigger>
            <SelectValue placeholder='Semua Organisasi' />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid w-full max-w-sm items-center gap-1.5'>
        <Label>Tahun</Label>
        <Select
          value={initialYear}
          onValueChange={(val) => updateFilter('year', val ?? '')}
        >
          <SelectTrigger>
            <SelectValue placeholder='Semua Tahun' />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() - i
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {(initialOrganizationId || initialYear) && (
        <Button variant='ghost' onClick={clearFilters} className='gap-2'>
          <HugeiconsIcon icon={Cancel01Icon} className='size-4' />
          Reset
        </Button>
      )}
    </div>
  )
}
