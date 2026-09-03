/**
 * Pure helpers factored out of `og-image.tsx` so the mode/typography
 * decisions are unit-testable without going through `next/og`'s
 * `ImageResponse` (which needs a real render pipeline and resists unit
 * testing on its own).
 */

/** The two card modes ticket 04 asks for — one layout, two backgrounds. */
export type OgImageMode = 'bergambar' | 'tanpa-gambar'

/**
 * Bergambar only when the featured image's bytes were actually fetched.
 * A present `imageUrl` that failed to fetch (network error, non-2xx,
 * missing file) must still resolve here as `tanpa-gambar` — a broken card
 * is worse than a plain one.
 */
export const resolveOgImageMode = (imageBytes: unknown): OgImageMode =>
  imageBytes ? 'bergambar' : 'tanpa-gambar'

/**
 * Titles longer than this drop to the smaller tier (see below). Deliberately
 * equal to the default tier's character budget below it (ticket 10 — see the
 * comment on `TITLE_MAX_CHARS_BY_FONT_SIZE`) so a title that stays in the
 * default tier is, by construction, always short enough to skip truncation.
 */
export const TITLE_LONG_THRESHOLD = 50

export const TITLE_FONT_SIZE_DEFAULT = 80
export const TITLE_FONT_SIZE_LONG = 56

/**
 * Picks a smaller title font size once the title is long enough that the
 * default size would overflow — a one-word title stays large; a
 * 140-character title shrinks so more of it survives before `truncateTitle`
 * cuts the rest.
 */
export const resolveTitleFontSize = (title: string): number =>
  title.length > TITLE_LONG_THRESHOLD
    ? TITLE_FONT_SIZE_LONG
    : TITLE_FONT_SIZE_DEFAULT

/**
 * Character budget for each title tier, calibrated (manual render loop,
 * ticket 10 — `next dev` + real `ogImage()` calls, not guessed) so the title
 * never exceeds 3 lines within the plakat's effective text width (992px:
 * 1200px canvas minus 64px side padding minus 40px horizontal padding on
 * each side of the plakat itself). Narrower budgets than ticket 04's, and
 * for a different reason than just the narrower width: ticket 04 calibrated
 * against an average title, but a title made entirely of long words (fewer
 * break points, e.g. "Konsolidasi Kepemimpinan Kelembagaan Kemahasiswaan
 * Nasional") wraps far less efficiently than a mixed-length one of the same
 * character count — at the default tier's 80px font, a worst-case 59-char
 * title overflowed to 4 lines and clipped the plakat against the chip above
 * it. Both numbers below are calibrated against that worst case, not the
 * average case, with a safety margin below the actual observed breakpoint
 * (default tier broke at 59 chars, budgeted to 50; long tier broke at 100
 * chars, budgeted to 90).
 *
 * `-webkit-line-clamp` was tried first and rejected (ticket 04): this
 * satori/`ImageResponse` build accepts the property without error but does
 * not actually clip — a 193-character title rendered all 6 wrapped lines
 * instead of 3. A CSS property that silently no-ops is worse than no
 * truncation at all (it reads as "handled" in the JSX while doing nothing),
 * so the guarantee against overflowing the canvas has to come from cutting
 * the string itself.
 */
const TITLE_MAX_CHARS_BY_FONT_SIZE: Record<number, number> = {
  [TITLE_FONT_SIZE_DEFAULT]: 50,
  [TITLE_FONT_SIZE_LONG]: 90
}

/**
 * Truncates a title to the character budget for its (already-selected) font
 * tier, ellipsizing when it's cut. Pure string slicing — no JSX, no rendering
 * — so the "does truncation behave at edge-case lengths" seam ticket 04's
 * process notes ask for is unit-testable without `ImageResponse`.
 */
export const truncateTitle = (title: string): string => {
  const maxChars = TITLE_MAX_CHARS_BY_FONT_SIZE[resolveTitleFontSize(title)]
  if (title.length <= maxChars) return title
  return `${title.slice(0, maxChars - 1).trimEnd()}…`
}
