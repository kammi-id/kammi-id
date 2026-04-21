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

  const selectedName = React.useMemo(
    () => options.find((opt) => opt.code === value)?.name || '',
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  return (
    <Combobox
      value={selectedName}
      onValueChange={(name) => {
        const selectedOption = options.find((opt) => opt.name === name)
        if (selectedOption) {
          onValueChange(selectedOption.code)
        }
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
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
                <ComboboxItem key={opt.code} value={opt.name}>
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
