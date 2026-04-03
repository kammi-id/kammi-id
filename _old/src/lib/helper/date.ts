/**
 * Formats a date value into a human-readable Indonesian locale string.
 * Returns '—' for null/undefined values.
 */
export const formatDate = (value: unknown): string => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value as string)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
