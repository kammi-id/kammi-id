import React from 'react';
import { auth } from '@/lib/auth';
import { hasRequiredRole, hasMinimumLevel, UserRole, OrgLevel } from '@/lib/access-control';
import { LockKeyhole } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  levelRequirement?: OrgLevel;
}

const ForbiddenPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
    <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
      <LockKeyhole className="h-12 w-12" />
    </div>
    <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
      Access Forbidden
    </h1>
    <p className="max-w-md text-muted-foreground">
      You do not have the necessary permissions to access this area.
      Please contact your administrator if you believe this is an error.
    </p>
  </div>
);

export const AccessGuard = async ({
  children,
  allowedRoles,
  levelRequirement
}: AccessGuardProps) => {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return <ForbiddenPage />;
  }

  // Root bypass
  if (user.role === 'root') {
    return <>{children}</>;
  }

  // Role check
  if (allowedRoles && !hasRequiredRole(user.role as UserRole, allowedRoles)) {
    return <ForbiddenPage />;
  }

  // Level check
  if (levelRequirement && !hasMinimumLevel(user.connectedOrganization?.level as OrgLevel, levelRequirement)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};
