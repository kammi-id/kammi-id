'use client'

import * as React from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxList,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { searchTrainingAttendantsAction } from './action'
import type { TrainingType, EligibleMember } from '~/db/query/training'

interface TrainingAttendantComboboxProps {
  trainingId: string
  trainingType: TrainingType
  value: string
  onSelect: (member: EligibleMember) => void
  placeholder?: string
  className?: string
}

export const TrainingAttendantCombobox = ({
  trainingId,
  trainingType,
  value,
  onSelect,
  placeholder = 'Cari kader...',
  className
}: TrainingAttendantComboboxProps) => {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<EligibleMember[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setIsLoading(true)
      try {
        const response = await searchTrainingAttendantsAction(
          trainingId,
          trainingType,
          query
        )
        if (response.success) setResults(response.data)
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, trainingId, trainingType])

  const statusLabel: Record<string, string> = {
    ab1: 'AB1',
    ab2: 'AB2',
    ab3: 'AB3'
  }

  return (
    <Combobox
      value={value}
      onValueChange={(val) => {
        const selected = results.find((m) => m.id === val)
        if (selected) onSelect(selected)
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        aria-label={placeholder}
        className={className}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ComboboxContent>
        <ComboboxList>
          {isLoading ? (
            <div className='text-muted-foreground p-4 text-center text-xs'>
              Mencari...
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <ComboboxEmpty>
              Kader tidak ditemukan atau tidak memenuhi syarat.
            </ComboboxEmpty>
          ) : (
            <ComboboxGroup>
              {results.map((m) => (
                <ComboboxItem key={m.id} value={m.id}>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{m.name}</span>
                    <span className='text-[10px] opacity-60'>
                      {[
                        m.registerNumber,
                        statusLabel[m.status] ?? m.status,
                        m.isCertifiedMentor ? 'Pemandu' : null,
                        m.isCertifiedInstructor ? 'Instruktur' : null,
                        m.pw
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
