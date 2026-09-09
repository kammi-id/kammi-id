# Tentang Section Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hubungkan section "Tentang KAMMI" di homepage dengan halaman `/tentang` — fix broken links dan ganti card "Mini Strategi" dengan card "Sejarah Singkat" yang relevan.

**Architecture:** Perubahan menyentuh 4 file: (1) type + defaults di `site-settings.ts`, (2) markup homepage `about-section.tsx`, (3) Zod schema di `action.ts`, (4) form admin `about-form.tsx`. Field `miniStrategi*` di-rename ke `sejarahCard*` di semua layer secara bersamaan agar tidak ada mismatch.

**Tech Stack:** Next.js (RSC), TypeScript, Zod, Tailwind CSS

---

## File Map

| File                                                                             | Perubahan                                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/db/query/site-settings.ts`                                                  | Rename `miniStrategi*` → `sejarahCard*` di type `AboutSettings` + update `SETTINGS_DEFAULTS.about` |
| `src/app/(main)/_components/about-section/about-section.tsx`                     | Update field references + ganti markup card kanan                                                  |
| `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`                 | Rename field keys di `aboutSchema`                                                                 |
| `src/app/(dashboard)/dashboard/pages/home/_components/about-form/about-form.tsx` | Rename state vars, `name` attrs, label, placeholder                                                |

---

## Task 1: Update Type + Defaults di `site-settings.ts`

**Files:**

- Modify: `src/db/query/site-settings.ts`

- [ ] **Step 1: Update `AboutSettings` type**

Ganti blok type (baris 20–29) dengan:

```typescript
export type AboutSettings = {
  paragraph1: string
  paragraph2: string
  readMoreLabel: string
  readMoreHref: string
  sejarahCardTitle: string
  sejarahCardDescription: string
  sejarahCardLinkLabel: string
  sejarahCardLinkHref: string
}
```

- [ ] **Step 2: Update `SETTINGS_DEFAULTS.about`**

Ganti blok `about:` di `SETTINGS_DEFAULTS` (sekitar baris 116–128) dengan:

```typescript
about: {
  paragraph1:
    'KAMMI adalah wadah perjuangan permanen bagi mahasiswa muslim yang berkomitmen membangun Indonesia dengan semangat keislaman, kebangsaan, dan intelektualitas. Kami bergerak melampaui retorika, menghadirkan aksi nyata sebagai anak bangsa.',
  paragraph2:
    'Didirikan pada 1998, KAMMI telah melahirkan ribuan kader yang kini berkontribusi di berbagai sektor kehidupan bangsa: pemerintahan, akademisi, wirausaha, dan masyarakat sipil.',
  readMoreLabel: 'Lebih jauh tentang kami',
  readMoreHref: '/tentang',
  sejarahCardTitle: 'Lahir dari Rahim Reformasi',
  sejarahCardDescription:
    'Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang konsisten menjaga arah perubahan tetap berada di jalur keadilan dan kebenaran.',
  sejarahCardLinkLabel: 'Baca sejarah lengkap',
  sejarahCardLinkHref: '/tentang#sejarah'
} satisfies AboutSettings,
```

- [ ] **Step 3: Verifikasi TypeScript tidak error**

```bash
bun run check:types 2>&1 | grep -A3 "site-settings\|AboutSettings"
```

Expected: tidak ada error terkait `AboutSettings`.

- [ ] **Step 4: Commit**

```bash
git add src/db/query/site-settings.ts
git commit -m "refactor: rename miniStrategi→sejarahCard in AboutSettings type and defaults"
```

---

## Task 2: Update Markup Homepage `about-section.tsx`

**Files:**

- Modify: `src/app/(main)/_components/about-section/about-section.tsx`

- [ ] **Step 1: Update field references di Link "baca lebih jauh"**

Di baris 35–52, `about.readMoreHref` dan `about.readMoreLabel` tidak berubah namanya — sudah benar. Pastikan tidak ada referensi `miniStrategi*` yang tersisa.

- [ ] **Step 2: Ganti seluruh blok card kanan**

Ganti blok `{/* Right: Mini Strategi card */}` (baris 55–115) dengan:

```tsx
{
  /* Right: Sejarah Singkat card */
}
;<div className='flex flex-col gap-4'>
  <div className='bg-primary text-primary-foreground rounded-2xl p-6'>
    {/* Calendar icon */}
    <div className='bg-primary-foreground/15 mb-4 flex size-10 items-center justify-center rounded-xl'>
      <svg
        className='size-5'
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
      >
        <rect
          x='3'
          y='4'
          width='18'
          height='18'
          rx='2'
          stroke='currentColor'
          strokeWidth='1.5'
        />
        <path
          d='M16 2v4M8 2v4M3 10h18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <path
          d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </svg>
    </div>

    {/* Date badge */}
    <p className='text-primary-foreground/60 font-sans text-xs font-semibold tracking-widest uppercase'>
      29 Maret 1998 · Malang
    </p>

    <h3 className='font-heading mt-1 text-lg font-bold'>
      {about.sejarahCardTitle}
    </h3>
    <p className='text-primary-foreground/80 mt-2 font-sans text-sm leading-relaxed'>
      {about.sejarahCardDescription}
    </p>
    <Link
      href={about.sejarahCardLinkHref}
      className='text-primary-foreground/90 hover:text-primary-foreground mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold'
    >
      {about.sejarahCardLinkLabel}
      <svg
        className='size-4'
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden='true'
      >
        <path
          d='M3 8h10M9 4l4 4-4 4'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </Link>
  </div>
</div>
```

- [ ] **Step 3: Verifikasi TypeScript tidak error**

```bash
bun run check:types 2>&1 | grep -A3 "about-section"
```

Expected: tidak ada error.

- [ ] **Step 4: Buka browser dan lihat hasilnya**

Navigasi ke `http://localhost:3000/` dan scroll ke section "Tentang KAMMI". Pastikan:

- Card kanan menampilkan icon kalender, tanggal, judul, deskripsi, dan link
- Link "Lebih jauh tentang kami" mengarah ke `/tentang`
- Link "Baca sejarah lengkap" mengarah ke `/tentang#sejarah`

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/_components/about-section/about-section.tsx
git commit -m "feat: replace Mini Strategi card with Sejarah Singkat card in about-section"
```

---

## Task 3: Update Dashboard — `action.ts` + `about-form.tsx`

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`
- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/about-form/about-form.tsx`

- [ ] **Step 1: Update `aboutSchema` di `action.ts`**

Ganti blok `aboutSchema` (baris 91–102) dengan:

```typescript
const aboutSchema = z.object({
  paragraph1: z.string().min(1, 'Paragraf 1 wajib diisi.'),
  paragraph2: z.string().min(1, 'Paragraf 2 wajib diisi.'),
  readMoreLabel: z.string().min(1),
  readMoreHref: z.string().min(1),
  sejarahCardTitle: z.string().min(1, 'Judul card sejarah wajib diisi.'),
  sejarahCardDescription: z
    .string()
    .min(1, 'Deskripsi card sejarah wajib diisi.'),
  sejarahCardLinkLabel: z.string().min(1),
  sejarahCardLinkHref: z.string().min(1)
})
```

- [ ] **Step 2: Update `about-form.tsx` — state vars dan sync effect**

Ganti semua referensi `miniStrategi*` di `about-form.tsx`:

```typescript
// State vars (ganti 4 baris lama)
const [sejarahCardTitle, setSejarahCardTitle] = useState(
  initialData.sejarahCardTitle
)
const [sejarahCardDescription, setSejarahCardDescription] = useState(
  initialData.sejarahCardDescription
)
const [sejarahCardLinkLabel, setSejarahCardLinkLabel] = useState(
  initialData.sejarahCardLinkLabel
)
const [sejarahCardLinkHref, setSejarahCardLinkHref] = useState(
  initialData.sejarahCardLinkHref
)
```

Ganti `useUnsavedChanges` object:

```typescript
const { isDirty, markClean } = useUnsavedChanges({
  paragraph1,
  paragraph2,
  readMoreLabel,
  readMoreHref,
  sejarahCardTitle,
  sejarahCardDescription,
  sejarahCardLinkLabel,
  sejarahCardLinkHref
})
```

Ganti blok sync `state.values` (dalam `useEffect` kedua):

```typescript
if (state.values.sejarahCardTitle !== undefined)
  setSejarahCardTitle(state.values.sejarahCardTitle)
if (state.values.sejarahCardDescription !== undefined)
  setSejarahCardDescription(state.values.sejarahCardDescription)
if (state.values.sejarahCardLinkLabel !== undefined)
  setSejarahCardLinkLabel(state.values.sejarahCardLinkLabel)
if (state.values.sejarahCardLinkHref !== undefined)
  setSejarahCardLinkHref(state.values.sejarahCardLinkHref)
```

- [ ] **Step 3: Update JSX form — card section**

Ganti blok `<div className='border-border bg-muted/40 rounded-2xl border p-5'>` dengan:

```tsx
<div className='border-border bg-muted/40 rounded-2xl border p-5'>
  <p className='text-foreground mb-4 text-sm font-medium'>
    Card Sejarah Singkat
  </p>
  <div className='space-y-4'>
    <Field>
      <FieldLabel htmlFor='sejarahCardTitle'>Judul Card</FieldLabel>
      <FieldContent>
        <Input
          id='sejarahCardTitle'
          name='sejarahCardTitle'
          value={sejarahCardTitle}
          onChange={(e) => setSejarahCardTitle(e.target.value)}
          placeholder='Lahir dari Rahim Reformasi'
        />
      </FieldContent>
      <FieldError errors={fe.sejarahCardTitle?.map((m) => ({ message: m }))} />
    </Field>
    <Field>
      <FieldLabel htmlFor='sejarahCardDescription'>Deskripsi Card</FieldLabel>
      <FieldContent>
        <Textarea
          id='sejarahCardDescription'
          name='sejarahCardDescription'
          value={sejarahCardDescription}
          onChange={(e) => setSejarahCardDescription(e.target.value)}
          rows={3}
          placeholder='Dari kampus ke kampus, KAMMI tumbuh...'
        />
      </FieldContent>
      <FieldError
        errors={fe.sejarahCardDescription?.map((m) => ({ message: m }))}
      />
    </Field>
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <Field>
        <FieldLabel htmlFor='sejarahCardLinkLabel'>Label Link Card</FieldLabel>
        <FieldContent>
          <Input
            id='sejarahCardLinkLabel'
            name='sejarahCardLinkLabel'
            value={sejarahCardLinkLabel}
            onChange={(e) => setSejarahCardLinkLabel(e.target.value)}
            placeholder='Baca sejarah lengkap'
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel htmlFor='sejarahCardLinkHref'>Link Card</FieldLabel>
        <FieldContent>
          <Input
            id='sejarahCardLinkHref'
            name='sejarahCardLinkHref'
            value={sejarahCardLinkHref}
            onChange={(e) => setSejarahCardLinkHref(e.target.value)}
            placeholder='/tentang#sejarah'
          />
        </FieldContent>
      </Field>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Verifikasi TypeScript tidak error**

```bash
bun run check:types 2>&1 | grep -E "action\.ts|about-form"
```

Expected: tidak ada error.

- [ ] **Step 5: Test dashboard form di browser**

Navigasi ke `http://localhost:3000/dashboard/pages/home`. Pastikan:

- Section "Card Sejarah Singkat" muncul dengan field yang benar
- Tidak ada field "Mini Strategi" tersisa
- Placeholder link sudah `/tentang#sejarah`

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/action.ts \
        src/app/\(dashboard\)/dashboard/pages/home/_components/about-form/about-form.tsx
git commit -m "feat: update about-form and schema to use sejarahCard fields"
```
