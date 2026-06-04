'use client'

import { Select } from '@base-ui/react/select'
import { cn } from '~/lib/shadcn/utils'
import { BaseUISelectProps } from './types'

const BaseUISelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  isLoading = false,
  label,
  error,
  name
}: BaseUISelectProps) => {
  return (
    <div className='flex w-full flex-col gap-1.5'>
      {label && (
        <label
          className='text-sm font-medium text-foreground'
          htmlFor={name}
        >
          {label}
        </label>
      )}

      <Select.Root
        value={value}
        onValueChange={(val) => val != null && onChange?.(val)}
        disabled={isLoading}
        name={name}
      >
        <Select.Trigger
          id={name}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
            'border-input hover:border-ring/50 transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[popup-open]:border-ring data-[popup-open]:ring-2 data-[popup-open]:ring-ring/30',
            'data-placeholder:text-muted-foreground',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring',
            error && 'border-destructive'
          )}
        >
          <Select.Value placeholder={placeholder}>
            {isLoading ? 'Loading options...' : undefined}
          </Select.Value>
          <Select.Icon className='flex items-center justify-center'>
            <svg
              className='h-4 w-4 text-muted-foreground transition-transform data-[popup-open]:rotate-180'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner sideOffset={4}>
            <Select.Popup
              className={cn(
                'z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-md border border-input bg-popover py-1 text-popover-foreground shadow-md',
                'transition-[transform,scale,opacity] duration-150',
                'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
                'data-[ending-style]:scale-95 data-[ending-style]:opacity-0'
              )}
            >
              <Select.List className='max-h-60 overflow-auto outline-none'>
                {options.length === 0 && !isLoading ? (
                  <div className='px-3 py-2 text-center text-sm text-muted-foreground'>
                    No options found
                  </div>
                ) : (
                  options.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={cn(
                        'cursor-pointer px-3 py-2 text-sm transition-colors outline-none',
                        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                        'data-[selected]:font-semibold',
                        'text-foreground',
                        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
                      )}
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))
                )}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      {error && (
        <p className='text-xs text-destructive'>{error}</p>
      )}
    </div>
  )
}

export default BaseUISelect
