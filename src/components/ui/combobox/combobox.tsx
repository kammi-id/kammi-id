'use client';

import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react';
import { ComboboxProps, ComboboxOption } from './types';
import { cn } from '@/lib/utils';

const Combobox = <T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className,
  renderOption,
  onSearch,
}: ComboboxProps<T>) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  return (
    <BaseCombobox.Root
      value={value}
      onValueChange={(val) => onChange?.(val as T)}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <BaseCombobox.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <BaseCombobox.Value placeholder={placeholder} />
        <span className="opacity-50">▼</span>
      </BaseCombobox.Trigger>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="z-50">
          <BaseCombobox.Popup
            className={cn(
              'w-[var(--combobox-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
            )}
          >
            <div className="p-1">
              <BaseCombobox.Input
                className={cn(
                  'flex h-9 w-full rounded-sm bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                )}
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search..."
              />
            </div>

            <BaseCombobox.List className="max-h-[300px] overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <BaseCombobox.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
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
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </div>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
};

export { Combobox };
