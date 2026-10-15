/**
 * Utility functions for the Members Add Form.
 */

/**
 * Gets the current year.
 *
 * @returns {number} The current year as a four-digit integer.
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear()
}

/**
 * Maps gender codes to human-readable labels.
 *
 * @param {string} gender - The gender code ('ikhwan' or 'akhwat').
 * @returns {string} The human-readable label for the gender.
 */
export const getGenderLabel = (gender: string): string => {
  return gender === 'ikhwan' ? 'Laki-laki' : 'Perempuan'
}

/**
 * Maps member status codes to human-readable labels.
 *
 * @param {string} status - The status code ('ab1', 'ab2', or 'ab3').
 * @returns {string} The human-readable label for the status.
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'ab1':
      return 'Anggota Biasa 1'
    case 'ab2':
      return 'Anggota Biasa 2'
    case 'ab3':
      return 'Anggota Biasa 3'
    default:
      return 'Unknown Status'
  }
}

/**
 * Recursively collects all descendant organization IDs for a given parent
 * organization within a flat list of organizations.
 *
 * @param {string} parentId - The ID of the parent organization.
 * @param {{ id: string; parentId?: string | null }[]} allOrgs - The flat list of organizations.
 * @returns {string[]} The IDs of all descendant organizations.
 */
export const getDescendantIds = (
  parentId: string,
  allOrgs: { id: string; parentId?: string | null }[]
): string[] => {
  const descendants: string[] = []
  const children = allOrgs.filter((org) => org.parentId === parentId)
  children.forEach((child) => {
    descendants.push(child.id)
    descendants.push(...getDescendantIds(child.id, allOrgs))
  })
  return descendants
}
