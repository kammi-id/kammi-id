/**
 * Matches object keys that likely carry sensitive data — these values are
 * masked before being written to logs so credentials never reach stdout.
 */
const SENSITIVE_KEY_PATTERN = /password|token|secret|session|credential/i

const REDACTED = '[REDACTED]'

/**
 * Recursively walks a value and replaces any object property whose key
 * matches {@link SENSITIVE_KEY_PATTERN} with `'[REDACTED]'`. If the matched
 * key holds a nested object or array, the value is recursed into instead —
 * so e.g. `credentials: { secret, sessionToken }` ends up with each leaf
 * masked individually rather than the whole object collapsed. Arrays are
 * walked element-by-element; primitives pass through unchanged.
 *
 * Use this whenever logging payloads that may carry credentials (form data,
 * session objects, validated input, etc.).
 */
export const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) && (val === null || typeof val !== 'object')
          ? REDACTED
          : redact(val)
      ])
    )
  }

  return value
}
