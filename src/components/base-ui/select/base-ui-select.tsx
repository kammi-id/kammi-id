'use client'

import React, { useEffect, useMemo } from 'react'
import { useSelect } from './use-select'
import { BaseUISelectProps, SelectOption } from './types'
import { cn } from '@/lib/utils'

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
  // Find initial option based on value prop for controlled component support
  const initialOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  )

  const { state, actions } = useSelect(initialOption)

  // Sync internal state with controlled value
  useEffect(() => {
    const currentOption = options.find((opt) => opt.value === value)
    if (currentOption) {
      // We only update if the value actually changed to avoid loop
      if (state.selectedOption?.value !== value) {
        // Note: In a real BaseUI implementation, you'd use a dispatcher or reducer
        // For this example, we'll assume the component re-renders with new props
      }
    }
  }, [value, options, state.selectedOption])

  const handleOptionClick = (option: SelectOption) => {
    actions.selectOption(option)
    if (onChange) {
      onChange(option.value)
    }
  }

  const highlightedOption = options[state.highlightedIndex]

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

      <div className='relative'>
        <button
          type='button'
          id={name}
          onClick={actions.open}
          disabled={isLoading}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-all dark:bg-slate-900',
            'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            state.isOpen && 'border-transparent ring-2 ring-blue-500'
          )}
        >
          <span
            className={cn(
              'truncate',
              !state.selectedOption && 'text-slate-400'
            )}
          >
            {isLoading
              ? 'Loading options...'
              : state.selectedOption?.label || placeholder}
          </span>
          <svg
            className={cn(
              'h-4 w-4 transition-transform',
              state.isOpen && 'rotate-180'
            )}
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
        </button>

        {state.isOpen && (
          <div className='absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900'>
            {options.length === 0 && !isLoading ? (
              <div className='px-3 py-2 text-center text-sm text-slate-500'>
                No options found
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionClick(option)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm transition-colors',
                    state.highlightedIndex === index
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    option.disabled &&
                      'pointer-events-none cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  )
}

export default BaseUISelect
