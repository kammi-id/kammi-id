import { useState, useCallback, useMemo } from 'react'
import { SelectOption, SelectState, SelectActions } from './types'

export const useSelect = (
  initialOption: SelectOption | null = null
): { state: SelectState; actions: SelectActions } => {
  const [state, setState] = useState<SelectState>({
    isOpen: false,
    selectedOption: initialOption,
    highlightedIndex: 0
  })

  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, highlightedIndex: 0 }))
  }, [])

  const selectOption = useCallback((option: SelectOption) => {
    setState((prev) => ({
      ...prev,
      selectedOption: option,
      isOpen: false,
      highlightedIndex: 0
    }))
  }, [])

  const moveHighlight = useCallback((direction: 'up' | 'down') => {
    setState((prev) => {
      const newIndex =
        direction === 'up'
          ? Math.max(0, prev.highlightedIndex - 1)
          : prev.highlightedIndex + 1 // Bound check happens in the component based on options length
      return { ...prev, highlightedIndex: newIndex }
    })
  }, [])

  return {
    state,
    actions: { open, close, selectOption, moveHighlight }
  }
}
