import { Select } from '@base-ui/react/select'
import { cn } from '~/lib/shadcn/utils'
import React from 'react'

export interface AsyncSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AsyncSelectProps {
  value?: string | null
  onChange?: (value: string | null) => void
  options: AsyncSelectOption[]
  onLoadMore?: () => Promise<void>
  isLoading?: boolean
  placeholder?: string
  label?: string
  error?: string
  name?: string
}

export const AsyncSelect = ({
  value,
  onChange,
  options,
  onLoadMore,
  isLoading = false,
  placeholder = 'Select option...',
  label,
  error,
  name
}: AsyncSelectProps) => {
  return (
    <div className='flex w-full flex-col gap-1.5'>
      {label && (
        <label
          className='text-sm font-medium text-slate-700 dark:text-slate-300'
          htmlFor={name}
        >
          {label}
        </label>
      )}

      <Select.Root value={value} onValueChange={(val) => onChange?.(val)}>
        <Select.Trigger
          id={name}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-all dark:bg-slate-900',
            'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500',
            'data-[popup-open]:border-transparent data-[popup-open]:ring-2 data-[popup-open]:ring-blue-500'
          )}
        >
          <Select.Value placeholder={placeholder}>
            {isLoading && !value ? 'Loading...' : undefined}
          </Select.Value>
          <Select.Icon className='flex items-center justify-center'>
            <svg
              className='h-4 w-4 transition-transform data-[popup-open]:rotate-180'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
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
          <Select.Positioner sideOffset={8}>
            <Select.Popup
              className={cn(
                'z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900',
                'transition-[transform,scale,opacity] duration-150',
                'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
                'data-[ending-style]:scale-95 data-[ending-style]:opacity-0'
              )}
            >
              <Select.List className='max-h-60 overflow-auto outline-none'>
                {options.length === 0 && !isLoading ? (
                  <div className='px-3 py-2 text-center text-sm text-slate-500'>
                    No options found
                  </div>
                ) : (
                  <>
                    {options.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={cn(
                          'cursor-pointer px-3 py-2 text-sm transition-colors outline-none',
                          'data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-400',
                          'data-[selected]:font-semibold',
                          'text-slate-700 dark:text-slate-300',
                          'disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}

                    {onLoadMore && (
                      <div
                        className='cursor-pointer px-3 py-2 text-center text-sm text-blue-600 transition-colors hover:bg-slate-100 dark:text-blue-400 dark:hover:bg-slate-800'
                        onClick={(e) => {
                          e.stopPropagation()
                          onLoadMore()
                        }}
                      >
                        {isLoading ? 'Loading more...' : 'Load more'}
                      </div>
                    )}
                  </>
                )}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  )
}
