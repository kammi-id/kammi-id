import { readActiveSession } from './cookies'

export const requireVerificationKeyManageAccess =
  async (): Promise<boolean> => {
    const session = await readActiveSession()
    return session?.user.role === 'root'
  }
