import { readActiveSession, type SessionUser } from './cookies'

export type DaurahCreationAccess =
  | { allowed: true; user: SessionUser }
  | { allowed: false; message: string }

/**
 * Resolves the caller allowed to hold a Daurah — and, in the same breath, to
 * browse the national pool of certified Instruktur while filling the form.
 * The privilege is held by `root` and `bpk`. Denials carry their own message
 * so every call site refuses in the same words.
 */
export const requireDaurahCreationAccess =
  async (): Promise<DaurahCreationAccess> => {
    const session = await readActiveSession()
    if (!session?.user)
      return { allowed: false, message: 'Sesi tidak ditemukan.' }

    const { user } = session
    if (user.role !== 'root' && user.role !== 'bpk')
      return {
        allowed: false,
        message: 'Antum tidak memiliki hak akses untuk menambah daurah.'
      }

    return { allowed: true, user }
  }
