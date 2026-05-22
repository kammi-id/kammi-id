# Spec: Individual Member List Integration (Tabbed View)

## Context

Display a detailed list of all individual members and an organization summary table using a Tabbed View in the Member Dashboard.

## Data Layer

- Implement recursive member fetching logic in `src/db/query/member.ts`.
- Fetch data based on the current organization's descendant tree.

## UI Components

- **Tabs Container**: Using shadcn/ui `Tabs`.
  - Tab "Daftar Kader": Displays `IndividualMemberTable`.
  - Tab "Ringkasan Struktur": Displays existing `MembersTable`.
- **IndividualMemberTable**: New component using `DataTable`.
- **Columns**: Name, Register Number, Organization, Status, Gender, Phone, Year of Entry.

## Navigation & State

- **Independent Query Params**:
  - Individual: `mq`, `mpage`, `msize`, `msort`.
  - Summary: `q`, `page`, `size`, `sort`.
- **Active Tab State**: Persisted in URL query param `?tab=`.

## Implementation Steps

1. Refactor `readMember` to support recursive organization search.
2. Create `IndividualMemberTable` with prefix-aware `DataTable` logic.
3. Implement Tabs in `MembersPage`.
4. Integrate the new fetching logic and parallel data loading.
