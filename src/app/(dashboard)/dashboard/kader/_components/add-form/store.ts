import { atom, map } from 'nanostores'
import { type IndividualMember } from '../individual-table/types'

export const memberSheetStore = atom<boolean>(false)
export const memberEditData = atom<IndividualMember | null>(null)
export const isSavingStore = atom<boolean>(false)

// State for inline quick-add rows
export const inlineMembersStore = atom<Partial<IndividualMember>[]>([])

export const openMemberSheet = (data: IndividualMember | null = null) => {
  memberEditData.set(data)
  memberSheetStore.set(true)
}

export const closeMemberSheet = () => {
  memberSheetStore.set(false)
  setTimeout(() => memberEditData.set(null), 300) // Clear after transition
}

export const addInlineRow = () => {
  const current = inlineMembersStore.get()
  inlineMembersStore.set([
    ...current,
    {
      name: '',
      organizationId: '',
      status: 'ab1',
      gender: 'ikhwan',
      phone: '',
      yearOfEntry: new Date().getFullYear().toString()
    }
  ])
}

export const updateInlineRow = (
  index: number,
  data: Partial<IndividualMember>
) => {
  const current = inlineMembersStore.get()
  const updated = [...current]
  updated[index] = { ...updated[index], ...data }
  inlineMembersStore.set(updated)
}

export const removeInlineRow = (index: number) => {
  const current = inlineMembersStore.get()
  inlineMembersStore.set(current.filter((_, i) => i !== index))
}

export const clearInlineRows = () => {
  inlineMembersStore.set([])
}
