'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { fetchUniversitiesAction } from './action'
import type { UniversityItem } from '~/lib/api/university'

interface UniversityComboboxProps {
  nameField: string
  dataField: string
  defaultInstitutionName?: string
  defaultInstitutionData?: UniversityItem | null
}

export const UniversityCombobox = ({
  nameField,
  dataField,
  defaultInstitutionName = '',
  defaultInstitutionData = null
}: UniversityComboboxProps) => {
  const [query, setQuery] = useState(defaultInstitutionName)
  const [results, setResults] = useState<UniversityItem[]>([])
  const [selected, setSelected] = useState<UniversityItem | null>(
    defaultInstitutionData
  )
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetchUniversitiesAction(query)
      setLoading(false)
      if (res.success) setResults(res.data)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleValueChange = (name: string | null) => {
    if (!name) {
      setSelected(null)
      return
    }
    const uni = results.find((r) => r.name === name) ?? null
    setSelected(uni)
    if (uni) setQuery(uni.name)
  }

  return (
    <>
      <Combobox value={selected?.name ?? ''} onValueChange={handleValueChange}>
        <ComboboxInput
          placeholder='Cari nama institusi...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ComboboxContent>
          <ComboboxList>
            {loading ? (
              <div className='text-muted-foreground animate-pulse p-4 text-center text-sm'>
                Mencari...
              </div>
            ) : results.length === 0 ? (
              <ComboboxEmpty>
                {query.length < 2
                  ? 'Ketik minimal 2 karakter.'
                  : 'Institusi tidak ditemukan.'}
              </ComboboxEmpty>
            ) : (
              <ComboboxGroup>
                {results.map((uni) => (
                  <ComboboxItem
                    key={`${uni.name}-${uni.regency_code}`}
                    value={uni.name}
                  >
                    {uni.name}
                    {uni.short_name && uni.short_name !== uni.name && (
                      <span className='text-muted-foreground ml-1 text-xs'>
                        ({uni.short_name})
                      </span>
                    )}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <input type='hidden' name={nameField} value={selected?.name ?? ''} />
      <input
        type='hidden'
        name={dataField}
        value={selected ? JSON.stringify(selected) : ''}
      />
    </>
  )
}
