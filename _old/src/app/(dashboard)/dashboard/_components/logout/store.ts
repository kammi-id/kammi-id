import { atom } from 'nanostores'

export const $openLogoutDialog = atom<boolean>(false)
export const setOpenLogoutDialog = (value: boolean) =>
  $openLogoutDialog.set(value)
