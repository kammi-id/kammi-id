'use client'

import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import Sheet from '~/components/common/sheet'
import { Button } from '~/components/shadcn/ui/button'
import { useStore } from '@nanostores/react'
import { $openTrainingSheet, setOpenTrainingSheet } from './store'
import { Plus } from 'lucide-react'

type TrainingSheetProps = ComponentProps<typeof Sheet>

const TrainingSheet = ({
  children,
  ...props
}: TrainingSheetProps): JSX.Element => {
  const open = useStore($openTrainingSheet)

  return (
    <Sheet
      title='Tambah Dauroh'
      description='Isi form di bawah ini untuk menambahkan dauroh baru.'
      open={open}
      onOpenChange={setOpenTrainingSheet}
      showCloseButton={false}
      side='right'
      {...props}
    >
      {open && children}
    </Sheet>
  )
}

export default TrainingSheet

export const TrainingSheetButton = (): JSX.Element => {
  return (
    <Button onClick={() => setOpenTrainingSheet(true)}>
      <Plus data-icon='inline-start' />
      <span>Tambah Dauroh</span>
    </Button>
  )
}
