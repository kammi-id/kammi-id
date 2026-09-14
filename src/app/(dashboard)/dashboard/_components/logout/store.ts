import { atom } from 'nanostores'

export const isLogoutDialogOpen = atom(false)

export const openLogoutDialog = () => {
  isLogoutDialogOpen.set(true)
}

export const closeLogoutDialog = () => {
  isLogoutDialogOpen.set(false)
}
