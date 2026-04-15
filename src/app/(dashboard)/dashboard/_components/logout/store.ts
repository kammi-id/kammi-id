import { atom } from 'nanostores'

export const isLogoutDialogOpen = atom(false)

export function openLogoutDialog() {
  isLogoutDialogOpen.set(true)
}

export function closeLogoutDialog() {
  isLogoutDialogOpen.set(false)
}
