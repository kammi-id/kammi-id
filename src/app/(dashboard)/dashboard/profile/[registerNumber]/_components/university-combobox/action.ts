'use server'

import { universityApi, type UniversityItem } from '~/lib/api/university'

export type FetchUniversitiesResult = {
  success: boolean
  data: UniversityItem[]
}

// Transient in-memory cache, scoped to this process. Reused across search
// calls within the same debounce burst and across requests until the
// process restarts. Deliberately not a DB table or a runtime-written file —
// `output: 'standalone'` deploys via Docker, so anything written to disk at
// runtime disappears on the next redeploy (no volume for it in production).
const searchCache = new Map<string, UniversityItem[]>()

export const fetchUniversitiesAction = async (
  name: string
): Promise<FetchUniversitiesResult> => {
  const key = name.trim().toLowerCase()
  const cached = searchCache.get(key)
  if (cached) return { success: true, data: cached }

  try {
    const data = await universityApi.search(name)
    searchCache.set(key, data)
    return { success: true, data }
  } catch {
    // Vendor errors (429 quota exhaustion, network failures, etc.) degrade
    // gracefully into an empty result set instead of throwing — the
    // combobox is a suggestion, not a gate, so the UI simply falls back to
    // free-text entry.
    return { success: false, data: [] }
  }
}
