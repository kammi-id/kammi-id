import type { Organization } from '~/db/query/organization'

/** Jenjang — the rung a Struktur occupies in the tree. */
export type StrukturJenjang = Organization['type']

/**
 * The shape of the tree, stated once.
 *
 * This lives here rather than in `~/lib/auth/kestrukturan` — which is where it
 * used to be and which still consumes it — because three surfaces need it and
 * two of them are `'use client'`. `kestrukturan.ts` imports `~/db/query/organization`
 * for its gates, so a client component reaching through it for this table would
 * drag `db.ts` into the browser bundle (the hazard commit `6073b89` closed).
 * This module has no runtime import at all: the one import above is the
 * statement form of `import type`, which is erased rather than elided.
 *
 * Nothing lists `pp` as a legal child, so PP can never be created through any
 * path that consults this table.
 *
 * It guards the **shape** of the tree, not authority. The Kewenangan matrix in
 * `kestrukturan.ts` is a different question with a different answer, and the two
 * are deliberately not folded together.
 */
const CHILD_TYPES: Record<string, readonly StrukturJenjang[]> = {
  pp: ['pw', 'pdln'],
  pw: ['pd'],
  pd: ['pk'],
  pdln: ['pk'],
  pk: []
}

/** The Jenjang that may sit directly beneath `parentType`, in display order. */
export const childTypesOf = (parentType: string): readonly StrukturJenjang[] =>
  CHILD_TYPES[parentType] ?? []

export const isLegalChildType = (
  parentType: string,
  childType: string
): boolean => childTypesOf(parentType).includes(childType as StrukturJenjang)
