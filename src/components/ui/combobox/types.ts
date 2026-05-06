export interface ComboboxOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

export interface ComboboxProps<T = string> {
  options: ComboboxOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  className?: string;
  renderOption?: (option: ComboboxOption<T>) => React.ReactNode;
  onSearch?: (query: string) => void;
}
