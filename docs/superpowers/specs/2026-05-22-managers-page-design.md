# Design: Dashboard Managers Page

**Date:** 2026-05-22  
**Status:** Approved

## Summary

Move the "Pengurus Pusat" leadership form out of `/dashboard/pages/home` into its own dedicated page at `/dashboard/pages/managers`. No changes to public-facing data model or DB schema.

## File Structure

```
src/app/(dashboard)/dashboard/pages/
├── home/
│   ├── _components/
│   │   ├── action.ts              — remove saveLeadershipAction + leadershipSchema
│   │   └── leadership-form/       — DELETE
│   ├── _data/settings.ts          — remove getCachedLeadershipSettings
│   └── page.tsx                   — remove leadership section
│
└── managers/                      — NEW
    ├── _components/
    │   ├── action.ts              — saveLeadershipAction + leadershipSchema (moved)
    │   └── leadership-form/
    │       ├── leadership-form.tsx — moved, update import of saveLeadershipAction
    │       └── index.ts
    ├── _data/
    │   └── settings.ts            — getCachedLeadershipSettings only
    └── page.tsx                   — new page
```

## Access Control

Same as home: `isRoot || (role === 'humas' && connectedOrganization.type === 'pp')`. Redirect to `/dashboard` if unauthorized.

## Sidebar

Add "Pengurus Pusat" entry under the existing "Halaman Publik" nav group in `app-sidebar.tsx`, below "Halaman Utama". URL: `/dashboard/pages/managers`.

## Data

`saveLeadershipAction` continues to upsert to `site_settings` key `'leadership'`. No DB changes.
