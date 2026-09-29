'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { SITE_ICONS } from '~/lib/site-icons'

export const IconPicker = ({
  id,
  value,
  onChange
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) => (
  <Combobox
    items={SITE_ICONS}
    value={SITE_ICONS.find((icon) => icon.value === value) ?? SITE_ICONS[0]}
    onValueChange={(item) => item && onChange(item.value)}
  >
    <ComboboxInput id={id} placeholder='Cari ikon…' />
    <ComboboxContent>
      <ComboboxEmpty>Ikon tidak ditemukan.</ComboboxEmpty>
      <ComboboxList>
        {(item: (typeof SITE_ICONS)[number]) => (
          <ComboboxItem key={item.value} value={item}>
            <HugeiconsIcon icon={item.icon} />
            {item.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
)
