export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BaseUISelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
  error?: string;
  name?: string;
}

export interface SelectState {
  isOpen: boolean;
  selectedOption: SelectOption | null;
  highlightedIndex: number;
}

export interface SelectActions {
  open: () => void;
  close: () => void;
  selectOption: (option: SelectOption) => void;
  moveHighlight: (direction: 'up' | 'down') => void;
}
