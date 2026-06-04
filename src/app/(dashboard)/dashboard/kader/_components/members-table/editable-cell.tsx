'use client'

import * as React from 'react'
import { Input } from '~/components/shadcn/ui/input'
import { cn } from '~/lib/shadcn/utils'

interface EditableCellProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  type?: 'text' | 'number' | 'select'
}

export const EditableCell = ({
  value,
  onChange,
  placeholder = '...',
  className,
  type = 'text'
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = React.useState(false)

  const handleBlur = () => setIsEditing(false)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setIsEditing(false)
    if (e.key === 'Escape') {
      setIsEditing(false)
      // In a real app, we might revert the value here
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={cn(
          'text-muted-foreground flex h-8 cursor-text items-center justify-center px-2 italic',
          className
        )}
      >
        {value || placeholder}
      </div>
    )
  }

  return (
    <Input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn('h-8 px-2 py-0 text-xs focus-visible:ring-1', className)}
    />
  )
}
