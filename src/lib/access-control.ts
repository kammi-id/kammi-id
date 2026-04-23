export type UserRole = 'root' | 'bph' | 'bpk' | 'bpw' | 'humas' | 'member';
export type OrgLevel = 1 | 2 | 3 | 4; // 1: PP, 2: PW, 3: PD/PDLN, 4: PK

/**
 * Check if the user has one of the required roles.
 * Root role always has access.
 */
export const hasRequiredRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  if (userRole === 'root') return true;
  return allowedRoles.includes(userRole);
};

/**
 * Check if the user's level is at least the minimum required level.
 * Lower number means higher hierarchy (e.g., 1 is higher than 4).
 */
export const hasMinimumLevel = (userLevel: OrgLevel, minLevel: OrgLevel): boolean => {
  return userLevel <= minLevel;
};

/**
 * Helper to specifically check if a role is 'humas'.
 */
export const isHumas = (role: UserRole): boolean => {
  return role === 'humas' || role === 'root';
};
