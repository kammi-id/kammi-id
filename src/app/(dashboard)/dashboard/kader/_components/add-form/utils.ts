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
