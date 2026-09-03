import { atom, map } from 'nanostores'
import { type IndividualMember } from '../individual-table/types'

export type InlineRow = Partial<IndividualMember> & { _rowId: string }

export const memberSheetStore = atom<boolean>(false)
export const memberEditData = atom<IndividualMember | null>(null)
export const isSavingStore = atom<boolean>(false)

export const inlineMembersStore = atom<InlineRow[]>([])

export const openMemberSheet = (data: IndividualMember | null = null) => {
  memberEditData.set(data)
  memberSheetStore.set(true)
}

export const closeMemberSheet = () => {
  memberSheetStore.set(false)
  setTimeout(() => memberEditData.set(null), 300) // Clear after transition
}

export const updateInlineRow = (
  index: number,
  data: Partial<IndividualMember>
) => {
  const current = inlineMembersStore.get()
  const updated = [...current]
  updated[index] = { ...updated[index], ...data } as InlineRow
  inlineMembersStore.set(updated)
}

export const removeInlineRow = (index: number) => {
  const current = inlineMembersStore.get()
  inlineMembersStore.set(current.filter((_, i) => i !== index))
}

export const clearInlineRows = () => {
  inlineMembersStore.set([])
}

export const isEditModeStore = atom<boolean>(false)
export const editedRowsStore = map<Record<string, Partial<IndividualMember>>>(
  {}
)

export const enterEditMode = () => {
  isEditModeStore.set(true)
}

export const exitEditMode = () => {
  isEditModeStore.set(false)
}

export const setRowEdit = (
  memberId: string,
  data: Partial<IndividualMember>
) => {
  const current = editedRowsStore.get()
  editedRowsStore.setKey(memberId, { ...current[memberId], ...data })
}

export const clearRowEdits = () => {
  editedRowsStore.set({})
}
