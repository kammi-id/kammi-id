'use client'

import * as React from 'react'
import { cn } from '~/lib/shadcn/utils'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { RegionItem } from '~/lib/api/region'

interface RegionComboboxProps {
  value: string
  options: RegionItem[]
  placeholder: string
  onValueChange: (value: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export const RegionCombobox = ({
  value,
  options,
  placeholder,
  onValueChange,
  disabled = false,
  isLoading = false
}: RegionComboboxProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')

  const selectedOption = React.useMemo(() => {
    const found = options.find((opt) => opt.code === value)
    console.log(
      `[RegionCombobox Debug] Value: "${value}", Options Count: ${options.length}, Found:`,
      found
    )
    return found
  }, [options, value])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options

    if (value && searchQuery === value) return options

    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery, value])

  return (
    <Combobox value={value} onValueChange={onValueChange}>
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        value={selectedOption?.name ?? searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ComboboxContent>
        <ComboboxList>
          {isLoading ? (
            <div className='text-muted-foreground animate-pulse p-4 text-center text-sm'>
              Memuat data wilayah...
            </div>
          ) : filteredOptions.length === 0 ? (
            <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
          ) : (
            <ComboboxGroup>
              {filteredOptions.map((opt) => (
                <ComboboxItem key={opt.code} value={opt.code}>
                  {opt.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
