export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface BaseUISelectProps {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  isLoading?: boolean
  label?: string
  error?: string
  name?: string
}
