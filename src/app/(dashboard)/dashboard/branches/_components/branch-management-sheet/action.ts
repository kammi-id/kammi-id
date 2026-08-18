'use server'

import {
  readOrganization,
  readParentOrganization,
  isOrgInAccessScope,
  type Organization
} from '~/db/query/organization'
import { countLiveMembersByOrganization } from '~/db/query/member'
import { countTrainingsByOrganization } from '~/db/query/training'
import { requireKestrukturanReadAccess } from '~/lib/auth/kestrukturan'
import {
  checkDeactivation,
  checkDeletion,
  checkReactivation,
  describeChildJenjang,
  type ChildRef,
  type DeletionCounts
} from '~/lib/struktur/keadaan'
import {
  filterMoveCandidates,
  type StrukturRef
} from '~/lib/struktur/pindah-induk'

/** One row of the induk picker — enough to name it and show its `code`. */
export type MoveCandidate = {
  id: string
  name: string
  code: string
  type: string
}

/**
 * Everything the sheet has to say **before** anything is clicked, read in one
 * round trip when the sheet opens for **one** Struktur.
 *
 * That is the whole reason the actions sit in a sheet rather than on the card
 * (spec §8.2): Kader and Daurah counts are read once, on demand, for the row
 * somebody actually opened — not for twelve cards at a time — and the
 * prerequisites arrive as whole sentences the surface can print instead of
 * tooltips on dead menu items.
 */
export type StrukturSheetInfo = {
  nonaktifkan: { refusal: string | null; activeChildren: ChildRef[] }
  aktifkan: { refusal: string | null }
  hapus: { refusal: string | null; counts: DeletionCounts }
  pindah: {
    candidates: MoveCandidate[]
    /** "PW DKI Jakarta" — dead context in the dialog head, never a choice. */
    pwLabel: string | null
  }
  /** The domain word for what sits beneath this Jenjang: "Komisariat". */
  childJenjang: string
  /** Where the bulk shortcut parks the children, named in its own sentence. */
  parentName: string | null
}

const toRef = (org: Organization): StrukturRef => ({
  id: org.id,
  type: org.type,
  code: org.code,
  state: org.state
})

/**
 * The Struktur that may legally receive `org`, narrowed twice.
 *
 * **The pool is the grandparent plus its children**, and that one line covers
 * every Jenjang without a case per shape: a Komisariat's grandparent is its PW,
 * so the pool is the PW and its Daerah — the sibling Daerah it may move to,
 * plus the PW itself for *penitipan*. A Daerah's grandparent is PP, so its pool
 * is every PW and PDLN, all of which `checkMoveCandidate` then refuses on
 * `pwCode` — which is spec §6.3 answering for itself rather than being
 * restated here. A PW's grandparent does not exist, so its pool is empty.
 *
 * Then **Cakupan**, so the picker never offers a destination the server would
 * refuse. A control that lights and a request that passes are held to one
 * source (spec §8).
 */
const readMoveCandidates = async (
  scope: { role: string; connectedOrganizationId: string | null },
  org: Organization,
  parent: Organization | null
): Promise<MoveCandidate[]> => {
  const grandParent = parent ? await readParentOrganization(parent) : null
  if (!grandParent) return []

  const pool = [
    grandParent,
    ...(await readOrganization({ parentId: [grandParent.id] }))
  ]

  const legal = filterMoveCandidates(
    toRef(org),
    parent ? toRef(parent) : null,
    pool
  )

  const reachable = await Promise.all(
    legal.map(async (candidate) =>
      (await isOrgInAccessScope(scope, candidate.id)) ? candidate : null
    )
  )

  return reachable
    .filter((candidate): candidate is Organization => candidate !== null)
    .map(({ id, name, code, type }) => ({ id, name, code, type }))
}

/** The PW (or PDLN) a Struktur sits under — dead context, not a choice. */
const readPwLabel = async (
  org: Organization,
  parent: Organization | null
): Promise<string | null> => {
  let current = parent
  while (current) {
    if (current.type === 'pw' || current.type === 'pdln') return current.name
    current = await readParentOrganization(current)
  }
  return null
}

/**
 * Reads under the same gate that opens the Struktur surface at all. It answers
 * no question a `/dashboard/branches` reader could not already ask; what it
 * adds is two aggregates, and those are about the row, not about the caller.
 */
export const readStrukturSheetInfoAction = async (
  orgId: string
): Promise<StrukturSheetInfo | null> => {
  const scope = await requireKestrukturanReadAccess(orgId)
  if (!scope) return null

  const [org] = await readOrganization({ id: [orgId] })
  if (!org) return null

  const [parent, activeChildren, children, members, trainings] =
    await Promise.all([
      readParentOrganization(org),
      readOrganization({ parentId: [org.id], state: ['aktif'] }),
      readOrganization({ parentId: [org.id] }),
      countLiveMembersByOrganization(org.id),
      countTrainingsByOrganization(org.id)
    ])

  const counts: DeletionCounts = {
    children: children.length,
    members,
    trainings
  }

  const deactivation = checkDeactivation(org, activeChildren)

  return {
    nonaktifkan: {
      refusal: deactivation?.message ?? null,
      activeChildren:
        deactivation?.reason === 'anak-aktif' ? deactivation.activeChildren : []
    },
    aktifkan: { refusal: checkReactivation(org, parent)?.message ?? null },
    hapus: { refusal: checkDeletion(org, counts)?.message ?? null, counts },
    pindah: {
      candidates: await readMoveCandidates(scope, org, parent),
      pwLabel: await readPwLabel(org, parent)
    },
    childJenjang: describeChildJenjang(org.type),
    parentName: parent?.name ?? null
  }
}
