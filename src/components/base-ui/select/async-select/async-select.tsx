import { Select } from '@base-ui/react/select';
import { cn } from '@/lib/utils';
import React from 'react';

export interface AsyncSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AsyncSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: AsyncSelectOption[];
  onLoadMore?: () => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  name?: string;
}

export const AsyncSelect = ({
  value,
  onChange,
  options,
  onLoadMore,
  isLoading = false,
  placeholder = 'Select an option...',
  label,
  error,
  name,
}: AsyncSelectProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor={name}>
          {label}
        </label>
      )}

      <Select.Root
        value={value}
        onValueChange={(val) => onChange?.(val)}
      >
        <Select.Trigger
          id={name}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-md transition-all",
            "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500",
            "data-[state=open]:ring-2 data-[state=open]:ring-blue-500 data-[state=open]:border-transparent"
          )}
        >
          <Select.Value placeholder={placeholder}>
            {isLoading ? 'Loading...' : (placeholder)}
          </Select.Value>
          <span className="pointer-events-none flex items-center justify-center">
            <svg
              className="w-4 h-4 transition-transform data-[state=open]:rotate-180"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </Select.Trigger>

        <Select.Positioner>
          <Select.Portal>
            <Select.Content
              className={cn(
                "z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto py-1",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              )}
            >
              {options.length === 0 && !isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-500 text-center">
                  No options found
                </div>
              ) : (
                <Select.Group>
                  {options.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer transition-colors outline-none",
                        "data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-400",
                        "data-[selected]:font-semibold",
                        "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {option.label}
                    </Select.Item>
                  ))}

                  {onLoadMore && (
                    <div
                      className="px-3 py-2 text-sm text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadMore();
                      }}
                    >
                      {isLoading ? 'Loading more...' : 'Load more'}
                    </div>
                  )}
                </Select.Group>
              )}
            </Select.Content>
          </Select.Portal>
        </Select.Positioner>
      </Select.Root>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
