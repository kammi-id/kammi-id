import { type Organization } from '~/db/query/organization'

/**
 * Every destructive Struktur action is gated behind typing that Struktur's
 * `code` (spec §8.2), and the gate is checked on the **server** so it is a gate
 * rather than a decoration — a Server Action is reachable without the dialog
 * that renders it.
 *
 * It lives here rather than in each `action.ts` because it was written four
 * times before it was written once. What the typed string is compared against,
 * and how forgiving that comparison is, has to be one decision: a gate that is
 * case-sensitive in one action and not in another is not a gate, it is a
 * coin flip about which action you reached.
 */
export const confirmsStrukturCode = (
  org: Pick<Organization, 'code'>,
  typed: string
): boolean => typed.trim() === org.code

/**
 * One sentence for every mistyped confirmation. It names what was wrong without
 * echoing the expected value back — the dialog already shows it, and an action
 * reached without the dialog should not be handed it.
 */
export const WRONG_STRUKTUR_CODE = 'Kode struktur yang dimasukkan tidak sesuai.'
