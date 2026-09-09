import { atom } from 'nanostores'

export type OrganizationFormState = {
  name: string
  type: string
  level: number
  parentId: string | null
  slug: string
}

export const orgFormStore = atom<OrganizationFormState>({
  name: '',
  type: 'pd',
  level: 1,
  parentId: null,
  slug: ''
})

export const orgSheetStore = atom<boolean>(false)

export const resetOrgForm = () => {
  orgFormStore.set({
    name: '',
    type: 'pd',
    level: 1,
    parentId: null,
    slug: ''
  })
}
