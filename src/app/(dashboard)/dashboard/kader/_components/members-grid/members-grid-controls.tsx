'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton
} from '~/components/shadcn/ui/input-group'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { SearchIcon, Cancel01Icon } from '@hugeicons/core-free-icons'

export interface FilterOption {
  value: string
  label: string
}

const filterOptionsByParentType: Record<string, FilterOption[]> = {
  pp: [
    { value: 'pw', label: 'Wilayah' },
    { value: 'pdln', label: 'Luar Negeri' }
  ],
  pw: [
    { value: 'pd', label: 'Daerah' },
    { value: 'pk', label: 'Komisariat' }
  ]
}

export const getFilterOptionsForParent = (
  parentOrgType?: string
): FilterOption[] => {
  if (!parentOrgType) return []
  return filterOptionsByParentType[parentOrgType] ?? []
}

interface MembersGridControlsProps {
  currentSearch: string
  currentOrgTypes: string[]
  filterOptions: FilterOption[]
}

export const MembersGridControls = ({
  currentSearch,
  currentOrgTypes,
  filterOptions
}: MembersGridControlsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [localSearch, setLocalSearch] = useState(currentSearch)

  useEffect(() => {
    setLocalSearch(currentSearch)
  }, [currentSearch])

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateParams({ q: value || null })
      }, 300)
    },
    [updateParams]
  )

  const handleClear = useCallback(() => {
    setLocalSearch('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    updateParams({ q: null })
  }, [updateParams])

  const toggleType = useCallback(
    (typeValue: string) => {
      const current = new Set(currentOrgTypes)
      if (current.has(typeValue)) {
        current.delete(typeValue)
      } else {
        current.add(typeValue)
      }
      const joined = Array.from(current).join(',')
      updateParams({ orgType: joined || null })
    },
    [currentOrgTypes, updateParams]
  )

  const clearAllTypes = useCallback(() => {
    updateParams({ orgType: null })
  }, [updateParams])

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <InputGroup className='max-w-sm flex-1'>
        <InputGroupAddon align='inline-start'>
          <HugeiconsIcon icon={SearchIcon} className='size-4' strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          placeholder='Cari nama organisasi...'
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {localSearch && (
          <InputGroupAddon align='inline-end'>
            <InputGroupButton
              onClick={handleClear}
              size='icon-xs'
              aria-label='Hapus pencarian'
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                className='size-3'
                strokeWidth={2}
              />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {filterOptions.length > 0 && (
        <div className='flex items-center gap-1.5'>
          <Button
            variant={currentOrgTypes.length === 0 ? 'default' : 'outline'}
            size='sm'
            onClick={clearAllTypes}
          >
            Semua
          </Button>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={
                currentOrgTypes.includes(opt.value) ? 'default' : 'outline'
              }
              size='sm'
              onClick={() => toggleType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
