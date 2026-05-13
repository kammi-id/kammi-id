'use client'

import * as React from 'react'
import { Combobox as BaseCombobox } from '@base-ui/react'
import { ComboboxProps, ComboboxOption } from './types'
import { cn } from '~/lib/shadcn/utils'

const Combobox = <T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className,
  renderOption,
  onSearch
}: ComboboxProps<T>) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  return (
    <BaseCombobox.Root
      value={value}
      onValueChange={(val) => onChange?.(val as T)}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <BaseCombobox.Trigger
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <BaseCombobox.Value placeholder={placeholder} />
        <span className='opacity-50'>▼</span>
      </BaseCombobox.Trigger>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className='z-50'>
          <BaseCombobox.Popup
            className={cn(
              'bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 w-[var(--combobox-trigger-width)] overflow-hidden rounded-md border shadow-md'
            )}
          >
            <div className='p-1'>
              <BaseCombobox.Input
                className={cn(
                  'placeholder:text-muted-foreground flex h-9 w-full rounded-sm bg-transparent px-3 py-1 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'
                )}
                value={searchQuery}
                onChange={handleInputChange}
                placeholder='Search...'
              />
            </div>

            <BaseCombobox.List className='max-h-[300px] overflow-y-auto p-1'>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <BaseCombobox.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none'
                    )}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <span>{option.label}</span>
                    )}
                  </BaseCombobox.Item>
                ))
              ) : (
                <div className='text-muted-foreground py-6 text-center text-sm'>
                  No results found.
                </div>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  )
}

export { Combobox }
