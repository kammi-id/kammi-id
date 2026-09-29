import React from 'react'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  hasRequiredRole,
  hasMinimumLevel,
  type UserRole,
  type OrgLevel
} from '~/lib/access-control'
import { LockKeyhole } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface AccessGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  levelRequirement?: OrgLevel
}

const ForbiddenPage = () => (
  <div className='flex min-h-[60vh] flex-col items-center justify-center p-6 text-center'>
    <div className='bg-destructive/10 text-destructive mb-4 rounded-full p-4'>
      <HugeiconsIcon icon={LockKeyhole} className='h-12 w-12' />
    </div>
    <h1 className='text-foreground mb-2 text-2xl font-bold tracking-tight'>
      Access Forbidden
    </h1>
    <p className='text-muted-foreground max-w-md'>
      You do not have the necessary permissions to access this area. Please
      contact your administrator if you believe this is an error.
    </p>
  </div>
)

export const AccessGuard = async ({
  children,
  allowedRoles,
  levelRequirement
}: AccessGuardProps) => {
  const session = await readActiveSession()
  const user = session?.user

  if (!user) {
    return <ForbiddenPage />
  }

  // Root bypass
  if (user.role === 'root') {
    return <>{children}</>
  }

  // Role check
  if (allowedRoles && !hasRequiredRole(user.role as UserRole, allowedRoles)) {
    return <ForbiddenPage />
  }

  // Level check
  if (
    levelRequirement &&
    !hasMinimumLevel(
      user.connectedOrganization?.level as OrgLevel,
      levelRequirement
    )
  ) {
    return <ForbiddenPage />
  }

  return <>{children}</>
}
