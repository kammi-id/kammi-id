import { atom } from 'nanostores'

export const $openTrainingSheet = atom<boolean>(false)
export const setOpenTrainingSheet = (value: boolean) =>
  $openTrainingSheet.set(value)
