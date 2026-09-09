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
import { searchMembersAction } from '../add-form/action'
import { type IndividualMember } from '../individual-table/types'

interface MemberSearchComboboxProps {
  value: string
  onValueChange: (member: IndividualMember) => void
  placeholder?: string
  className?: string
}

export const MemberSearchCombobox = ({
  value,
  onValueChange,
  placeholder = 'Cari kader...',
  className
}: MemberSearchComboboxProps) => {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<IndividualMember[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await searchMembersAction(query)
        if (response.success) {
          setResults(response.data)
        }
      } catch (error) {
        console.error('Failed to search members:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <Combobox
      value={value}
      onValueChange={(val) => {
        const selected = results.find((m) => m.id === val)
        if (selected) {
          onValueChange(selected)
        }
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
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
            <ComboboxEmpty>Kader tidak ditemukan.</ComboboxEmpty>
          ) : (
            <ComboboxGroup>
              {results.map((member) => (
                <ComboboxItem key={member.id} value={member.id}>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{member.name}</span>
                    <span className='text-[10px] opacity-60'>
                      {member.registerNumber} • {member.status.toUpperCase()}
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
