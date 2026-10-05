# Production feedback — 2026-09-11

Status: shared understanding confirmed; implementation authorized.

## Confirmed scope

- Work on `dev-20260911` in a separate worktree.
- Add Events as an additional publication type, with the reference content at
  <https://pbhmi.id/event/beasiswa-pkpa-pb-hmi/> informing its details.
- Publish an Events list at `/events` and show latest Events on the homepage
  below the map and above news.
- Reduce spacing between homepage news sections. Show the latest eight in a
  single horizontally scrollable row, with one visible card on mobile, two on
  tablets, and three on larger screens; cap the container at `max-w-screen-lg`.
- Redesign the footer as four columns with `gap-4`: logo and address/phone/email
  span two columns, followed by two configurable titled menus. Menu entries have
  titles and destinations, potentially selecting existing Halaman or custom URLs.
- Add a second footer row spanning all columns for social links, with icons,
  titles, and URLs; support popular-network presets and custom links.
- Adapt the footer layout for mobile.
- Make the header action (currently “Ayo Gabung KAMMI”) configurable from the
  dashboard: title, icon, and destination URL.
- Preserve existing roles and access control unless explicitly changed during
  the interview.
- Later create a new PR and verify CI/CD and deployable container images.

## Resolved decisions — first round

1. Keep `dev-20260911` at its existing baseline; do not incorporate the 11
   additional commits from the current checkout. Preserve authorization as it
   exists on this chosen branch.
2. Events are editorial announcements with external links, separate from Daurah
   records, without registration or attendee management.
3. Prioritize upcoming Events by occurrence time rather than publication date.

## Resolved decisions — second round

The user accepted Q4–Q12 recommendations with two corrections: rename `/event`
to `/events`; target `main` with a PR for CI only, without merging it here.

### Events

- Required: title, poster (Gambar Utama), description, start date/time, timezone,
  and location. Optional: end date/time and external action link. Support WIB,
  WITA, and WIT.
- Occurrence time is separate from publication time. Future publication dates
  continue to prevent public visibility, even for upcoming Events.
- Prioritize upcoming Events by occurrence time. Keep ongoing Events visible
  until their end; without an explicit end, use the end of the start date in
  the selected local timezone.
- Past Events remain available under “Past Events” on the list.
- Cancelled Events retain detail pages with a cancellation notice and leave
  upcoming previews.
- Reuse news draft/publication/archive behavior. Archived Events leave lists
  while their published detail links remain readable.
- Published Event detail pages remain readable when their Struktur becomes
  inactive, following the existing news archive principle. Homepages and lists
  still stop serving when the Struktur becomes inactive.
- Each Situs Struktur shows only its own Events, including PP. No national
  Event aggregate; Events do not enter Berita KAMMI se-Indonesia.
- Rename `/event` to `/events`; detail pages use `/events/<slug>`. Update route
  references and check existing Halaman slug collisions before reserving the
  new route. The rename replaces the proposed retained `/event` redirect route.
- Homepage: up to eight upcoming/ongoing Events in one scrollable row with
  1/2/3 visible cards on mobile/tablet/larger screens. Hide the preview if empty.
- Place Events before own-Struktur news on every homepage, below the map on PP.
  Other Struktur homepages do not gain a map.

### News

- Preserve PP's own-Struktur and Berita KAMMI se-Indonesia sections separately.
- Load the latest eight Berita per section, not eight combined.
- Apply tighter spacing and the `max-w-screen-lg` scrollable row to all
  Struktur homepages, showing 1/2/3 cards across the requested screen sizes.
- Support swiping, keyboard access, and previous/next controls.

### Footer and header action

- Use the Struktur's logo, with editable public address, phone, and email in
  that Struktur's site settings.
- Desktop: four columns with `gap-4`; identity/contact spans two, each menu
  occupies one, and the social bar spans the complete second row.
- Mobile: stack identity/contact, each menu, then the wrapping social bar.
- Preserve the first existing menu; combine the second and third into the
  second new menu while retaining link order.
- Both menu titles and entries are editable. Support reordering entries and
  hiding empty menus.
- Selected Halaman links follow the page after its slug changes. Manually
  entered destination URLs remain supported.
- Social presets supply recognizable icons and editable titles/URLs. Custom
  links support an icon choice with a generic link fallback.
- Supply a searchable icon picker for the header action and custom social
  links; reuse existing header action title and URL settings.
- Preserve configured menu links, social URLs, and header action values when
  adapting existing settings to the new shape.
- Keep the existing site-settings and article authorization boundaries. Events
  inherit article permissions; no role or access-control changes.

### Delivery

- Work on `dev-20260911` from `876f8ba` in its separate worktree. Do not merge
  the other checkout's additional commits.
- Create a new PR targeting `main` for CI only. Do not merge it or enable
  automatic merge during this task.
- Verify CI and build-ready container images. PR checks alone do not establish
  an image build: existing image jobs run on branch pushes, which also trigger
  nonproduction deployment for `dev-*` branches.
- Production deployment is outside this PR-for-CI workflow.

## Acceptance evidence

- Verify Event ownership and existing article/settings permission boundaries.
- Cover publication timing separately from start/end boundaries across all
  three timezones, including ongoing, past, cancelled, and archived Events.
- Verify list/detail routing, navigation references, slug collisions, and
  inactive-Struktur archive behavior.
- Inspect rows/footer at mobile, tablet, and larger sizes; exercise swipe,
  keyboard, and previous/next controls.
- Verify existing settings survive migration and page links follow slug edits.
- Run required repository checks, relevant regression tests, production build
  and container checks, and Next.js DevTools `get_errors` with a running dev
  server. Report actual CI/image outcomes on the PR.

## Interview checkpoint

The user confirmed the consolidated scope. No additional product decision is
pending, and implementation is authorized.

## Repository facts

- The requested branch exists and was checked out in
  `/Users/radenpioneer/projects/kammi-id/.data/worktrees/dev-20260911` at `876f8ba`.
- The initial checkout is `dev-20260104` at `cef6af3`; branch integration has not
  been performed.
- The current glossary defines Artikel as Berita and Halaman. Events require an
  additional domain definition; the first-round agreement is now recorded there.
- The existing Event placeholder is `/event`, singular. `/events` is not yet
  reserved against Halaman slugs.
- PP has separate own-Struktur and national news sections; each currently loads
  12 items. Other Struktur homepages have own news and no map.
- Header action title and URL are already configurable under homepage Navigasi
  settings; its icon is not yet configurable.
- Footer currently has three fixed-title menus and four fixed social URL fields.
  Contact information has no existing settings or organization-record source.
- PR checks run for `main` and `dev-*` targets. Container images are built on
  push, and pushes to `dev-*` also trigger nonproduction deployment.
- Initial Next.js DevTools discovery found no running development server.

## Documentation approach

Record resolved product behavior here during the interview. Update `CONTEXT.md`
when domain terms settle. Add ADRs only for consequential trade-offs that are
costly to reverse and would otherwise surprise a future reader.

## Recovery and tooling

The temporary worktree disappeared during an interruption. Session records were
used to restore the edits into the project-local worktree above. The user approved
using official Base UI documentation instead of the unavailable base-ui-docs skill.
