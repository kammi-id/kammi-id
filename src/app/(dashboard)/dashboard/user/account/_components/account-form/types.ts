export interface AccountFormProps {
  initialData: {
    name: string
    displayName: string
  }
  /**
   * ADR 0027, Celah 4 — bagi Akun Kader, `name` ADALAH NIA-nya: identitas
   * permanen (ADR 0020) sekaligus identitas login, dan tidak pernah tampil
   * sebagai medan yang bisa disunting. Akun Kepengurusan tetap melihatnya.
   */
  canEditName: boolean
  children?: React.ReactNode
}
