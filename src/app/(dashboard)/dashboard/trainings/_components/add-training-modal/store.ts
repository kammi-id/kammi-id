import { atom } from 'nanostores'

export const addTrainingSheetStore = atom(false)

export const openAddTrainingSheet = () => addTrainingSheetStore.set(true)
export const closeAddTrainingSheet = () => addTrainingSheetStore.set(false)
