import { atom } from 'nanostores'
import { type IndividualMember } from '../individual-table/types'

export const memberSheetStore = atom<boolean>(false)
export const memberEditData = atom<IndividualMember | null>(null)

export const openMemberSheet = (data: IndividualMember | null = null) => {
  memberEditData.set(data)
  memberSheetStore.set(true)
}

export const closeMemberSheet = () => {
  memberSheetStore.set(false)
  setTimeout(() => memberEditData.set(null), 300) // Clear after transition
}
