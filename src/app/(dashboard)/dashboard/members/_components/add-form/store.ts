import { atom } from 'nanostores'

export const memberSheetStore = atom<boolean>(false)

export const openMemberSheet = () => {
  memberSheetStore.set(true)
}

export const closeMemberSheet = () => {
  memberSheetStore.set(false)
}
