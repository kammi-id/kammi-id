---
name: Region API Integration
description: Implementation of a server-side fetcher for Indonesia Regional API to replace mock address data in the Add Member form.
date: 2026-04-19
status: approved
---

# Design Spec: Region API Integration

## Overview

Replace the static `MOCK_ADDRESS_DATA` in the `AddMemberForm` with dynamic data fetched from the `api.co.id` Indonesia Regional API. This ensures accurate and up-to-date regional data for member registration.

## Requirements

- **API Source:** `https://docs.api.co.id/openapi/indonesia-regional.yaml`
- **Authentication:** Use `API_CO_ID_TOKEN` from `.env.local` via the `x-api-co-id` header.
- **Location:** Fetcher utility must be located in `src/lib/api/region.ts`.
- **UI Behavior:**
  - Cascading selection (Province $\rightarrow$ City $\rightarrow$ District $\rightarrow$ Subdistrict).
  - Loading indicators for each selection level.
  - Proper error handling with user notifications (toasts).
  - Support for edit mode (pre-populating selection based on existing codes).

## Architecture & Data Flow

### 1. API Utility Layer (`src/lib/api/region.ts`)

A server-side utility to handle raw API requests.

**Interface:**

- `RegionItem`: `{ code: string, name: string }`

**Methods:**

- `getProvinces()`: `GET /regional/indonesia/provinces`
- `getCities(provinceCode: string)`: `GET /regional/indonesia/provinces/{code}/regencies`
- `getDistricts(cityCode: string)`: `GET /regional/indonesia/regencies/{code}/districts`
- `getVillages(districtCode: string)`: `GET /regional/indonesia/districts/{code}/villages`

**Implementation Detail:**
Use a private `fetchRegionData` helper to manage the base URL, authentication headers, and basic error response parsing.

### 2. Server Action Layer (`src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`)

Expose the API utility to the client component via Server Actions.

**Actions:**

- `fetchProvincesAction()`: Returns `RegionItem[]`
- `fetchCitiesAction(provinceCode: string)`: Returns `RegionItem[]`
- `fetchDistrictsAction(cityCode: string)`: Returns `RegionItem[]`
- `fetchVillagesAction(districtCode: string)`: Returns `RegionItem[]`

### 3. Client Integration (`AddMemberForm`)

Update the form to use the server actions.

**State Management:**

- Local states for the current selection codes (`province`, `city`, `district`, `subdistrict`).
- Loading states for each level (`isLoadingProvince`, etc.).
- Data states to hold the lists of options (`provinces`, `cities`, etc.).

**Fetching Logic:**

- `useEffect` on mount: `fetchProvincesAction()`.
- `useEffect` on `province` change: `fetchCitiesAction(province)`.
- `useEffect` on `city` change: `fetchDistrictsAction(city)`.
- `useEffect` on `district` change: `fetchVillagesAction(district)`.

## Technical Implementation Details

### Authentication

The token is retrieved using `process.env.API_CO_ID_TOKEN`. Requests must include:
`headers: { 'x-api-co-id': process.env.API_CO_ID_TOKEN }`

### Error Handling

- **API Errors:** Catch network errors or non-200 responses in the utility layer and throw a custom `RegionApiError`.
- **UI Feedback:** The client-side `useEffect` catches errors and triggers `toast.error("Failed to load regional data. Please try again.")`.
- **Empty States:** If no results are returned, the `SelectContent` should display a "No data found" message.

## Testing Plan

- **Positive Case:** Select Province $\rightarrow$ Verify Cities load $\rightarrow$ Select City $\rightarrow$ Verify Districts load $\rightarrow$ Select District $\rightarrow$ Verify Villages load.
- **Invalid Code Case:** Pass an invalid code to `getCities` $\rightarrow$ Verify it handles the 404/empty response gracefully.
- **Token Missing Case:** Remove token from `.env` $\rightarrow$ Verify that an appropriate error is logged and a toast is shown.
- **Edit Mode Case:** Load a member with existing address codes $\rightarrow$ Verify that the corresponding names are fetched and displayed in the selects.
