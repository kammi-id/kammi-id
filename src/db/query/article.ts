export const isArticleOrgInScope = (
  user: { role: string; connectedOrganizationId?: string | null },
  articleOrgId: string
): boolean => {
  if (user.role === 'root') return true
  if (user.role === 'humas')
    return Boolean(user.connectedOrganizationId) &&
      user.connectedOrganizationId === articleOrgId
  return false
}
