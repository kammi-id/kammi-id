export type MemberTotalFilters = {
  isAlumn?: boolean
  isCertifiedMentor?: boolean
  isCertifiedInstructor?: boolean
}

/**
 * Which Kader count as a Struktur's `total`, derived from the route's
 * `activeType` — one rule, used both by the first server-rendered batch
 * (`members-page-content.tsx`) and every "Muat lagi" batch after it
 * (`action.ts`). Kept as a single function so the two never drift apart:
 * a card's displayed `total` and the order the keyset query returns it in
 * must always count the same Kader.
 */
export const deriveMemberTotalFilters = (
  activeType?: string
): MemberTotalFilters => ({
  isCertifiedMentor: activeType === 'pemandu' ? true : undefined,
  isCertifiedInstructor: activeType === 'instruktur' ? true : undefined,
  isAlumn:
    activeType === 'alumni'
      ? true
      : activeType === 'pemandu' || activeType === 'instruktur' || !activeType
        ? false
        : undefined
})
