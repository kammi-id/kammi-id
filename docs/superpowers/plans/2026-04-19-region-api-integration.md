# Region API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static mock address data in `AddMemberForm` with real-time data fetched from the Indonesia Regional API.

**Architecture:** A server-side utility (`src/lib/api/region.ts`) handles authenticated requests to `api.co.id`. These are exposed via Server Actions to the `AddMemberForm` client component, which manages cascading state and loading indicators.

**Tech Stack:** Next.js 16, TypeScript, Fetch API, Zod.

---

## Tasks

### Task 1: Implement Region API Fetcher Utility

**Files:**

- Create: `src/lib/api/region.ts`

- [ ] **Step 1: Define types and the base fetcher helper.**

```tsx
export interface RegionItem {
  code: string
  name: string
}

async function fetchRegionData<T>(endpoint: string): Promise<T> {
  const token = process.env.API_CO_ID_TOKEN
  if (!token) {
    throw new Error('API_CO_ID_TOKEN is not defined in environment variables')
  }

  const response = await fetch(`https://api.co.id${endpoint}`, {
    headers: {
      'x-api-co-id': token,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(
      `Region API error: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}
```

- [ ] **Step 2: Implement the region-specific fetcher methods.**

```tsx
export const regionApi = {
  async getProvinces(): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>('/regional/indonesia/provinces')
  },
  async getCities(provinceCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/provinces/${provinceCode}/regencies`
    )
  },
  async getDistricts(cityCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/regencies/${cityCode}/districts`
    )
  },
  async getVillages(districtCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(
      `/regional/indonesia/districts/${districtCode}/villages`
    )
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/region.ts
git commit -m "feat: implement region API fetcher utility"
```

### Task 2: Create Server Actions for Regional Data

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Import `regionApi` and implement fetch actions.**

```tsx
import { regionApi } from '~/lib/api/region'

export const fetchProvincesAction = async () => {
  try {
    return { data: await regionApi.getProvinces(), success: true }
  } catch (e: any) {
    return { error: e.message, success: false }
  }
}

export const fetchCitiesAction = async (provinceCode: string) => {
  try {
    return { data: await regionApi.getCities(provinceCode), success: true }
  } catch (e: any) {
    return { error: e.message, success: false }
  }
}

export const fetchDistrictsAction = async (cityCode: string) => {
  try {
    return { data: await regionApi.getDistricts(cityCode), success: true }
  } catch (e: any) {
    return { error: e.message, success: false }
  }
}

export const fetchVillagesAction = async (districtCode: string) => {
  try {
    return { data: await regionApi.getVillages(districtCode), success: true }
  } catch (e: any) {
    return { error: e.message, success: false }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/action.ts
git commit -m "feat: add server actions for regional data fetching"
```

### Task 3: Integrate API Fetching in AddMemberForm

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Remove `MOCK_ADDRESS_DATA` import and add new states for data and loading.**

```tsx
// Remove: import MOCK_ADDRESS_DATA from './_mock-address'
// Add:
const [provinces, setProvinces] = React.useState<RegionItem[]>([])
const [cities, setCities] = React.useState<RegionItem[]>([])
const [districts, setDistricts] = React.useState<RegionItem[]>([])
const [subdistricts, setSubdistricts] = React.useState<RegionItem[]>([])

const [isLoadingProvince, setIsLoadingProvince] = React.useState(false)
const [isLoadingCity, setIsLoadingCity] = React.useState(false)
const [isLoadingDistrict, setIsLoadingDistrict] = React.useState(false)
const [isLoadingSubdistrict, setIsLoadingSubdistrict] = React.useState(false)
```

- [ ] **Step 2: Implement `useEffect` hooks for cascading fetches.**

```tsx
// Initial provinces fetch
useEffect(() => {
  const loadProvinces = async () => {
    setIsLoadingProvince(true)
    const res = await fetchProvincesAction()
    if (res.success) setProvinces(res.data)
    else toast.error(res.error)
    setIsLoadingProvince(false)
  }
  loadProvinces()
}, [])

// Cities fetch when province changes
useEffect(() => {
  if (!province) {
    setCities([])
    return
  }
  const loadCities = async () => {
    setIsLoadingCity(true)
    const res = await fetchCitiesAction(province)
    if (res.success) setCities(res.data)
    else toast.error(res.error)
    setIsLoadingCity(false)
  }
  loadCities()
}, [province])

// Repeat similar logic for districts and subdistricts...
```

- [ ] **Step 3: Update JSX to use dynamic lists and loading indicators.**

```tsx
// For Province Select:
<SelectContent>
  {isLoadingProvince ? (
    <div className='p-2 text-center text-xs'>Loading...</div>
  ) : (
    provinces.map((p) => (
      <SelectItem key={p.code} value={p.code}>
        {p.name}
      </SelectItem>
    ))
  )}
</SelectContent>
```

- [ ] **Step 4: Handle Edit Mode pre-population.**
      Update the initial `useEffect` that syncs `editData` to also trigger the necessary fetches to populate the subsequent dropdowns.

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "feat: replace mock address data with real API integration"
```

### Task 4: Final Verification

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Test the full cascading flow in the browser.**
- [ ] **Step 2: Verify that `API_CO_ID_TOKEN` is used and not exposed to client.**
- [ ] **Step 3: Verify that edit mode correctly loads all levels of regional data.**
- [ ] **Step 4: Commit final cleanup**

```bash
git add .
git commit -m "chore: final verification of Region API integration"
```
