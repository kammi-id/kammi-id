import { persistentJSON } from '@nanostores/persistent'

export type CredentialEntry = {
  memberId: string
  name: string
  registerNumber: string
  password: string
  organizationId: string
  createdAt: string
}

export type CredentialStore = Record<string, CredentialEntry[]>

export const credentialStore = persistentJSON<CredentialStore>(
  'kammi:credentials',
  {}
)

export const appendCredentials = (
  organizationId: string,
  entries: CredentialEntry[]
) => {
  const current = credentialStore.get()
  const existing = current[organizationId] ?? []

  const updated = [...existing]
  for (const entry of entries) {
    const idx = updated.findIndex(
      (e) => e.registerNumber === entry.registerNumber
    )
    if (idx >= 0) {
      updated[idx] = entry
    } else {
      updated.push(entry)
    }
  }

  credentialStore.set({
    ...current,
    [organizationId]: updated
  })
}

export const clearCredentials = (organizationId: string) => {
  const current = credentialStore.get()
  credentialStore.set({
    ...current,
    [organizationId]: []
  })
}
