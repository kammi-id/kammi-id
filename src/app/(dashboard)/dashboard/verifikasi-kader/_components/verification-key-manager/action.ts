'use server'

import {
  createVerificationKey,
  revokeVerificationKey
} from '~/db/query/verification-key'
import { requireVerificationKeyManageAccess } from '~/lib/auth/verification-key'

export type CreateVerificationKeyState = { secret?: string; error?: string }

export const createVerificationKeyAction =
  async (): Promise<CreateVerificationKeyState> => {
    if (!(await requireVerificationKeyManageAccess())) {
      return { error: 'Antum tidak memiliki hak akses.' }
    }

    return { secret: await createVerificationKey() }
  }

export const revokeVerificationKeyAction = async (
  id: string
): Promise<void> => {
  if (!(await requireVerificationKeyManageAccess())) return
  await revokeVerificationKey(id)
}
