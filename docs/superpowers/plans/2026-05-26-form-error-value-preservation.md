# Form Error Value Preservation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ketika form error, kembalikan semua input value yang sudah diketik user ke kolom masing-masing — kecuali kolom sensitif (password).

**Architecture:** Setiap server action yang belum melakukannya perlu return `values: rawData` saat validasi gagal. Di sisi form, field yang masih menggunakan `defaultValue` (uncontrolled) diubah menjadi controlled `value` + `onChange` dengan nilai diambil dari `state.values` (fallback ke `initialData` atau default kosong).

**Tech Stack:** React `useActionState`, Next.js Server Actions, TypeScript

---

## File Map

| File                                                                                           | Perubahan                                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/app/(dashboard)/login/_components/login-form/action.ts`                                   | Tambah `values` ke `LoginFormState` & return saat error                  |
| `src/app/(dashboard)/login/_components/login-form/login-form.tsx`                              | Username field → controlled dengan `state.values`                        |
| `src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts`                        | Tambah `values` ke `OrgFormState` & return saat error                    |
| `src/app/(dashboard)/dashboard/branches/_components/add-form/add-form.tsx`                     | Fields `name`, `code`, `slug` → controlled; `type` (Select) → controlled |
| `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.ts`             | Tambah `values` ke `ActionResponse` & return saat error                  |
| `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/form.tsx`              | Field `name` & `registrationDeadline` → controlled state                 |
| `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`                               | Tambah `values` ke `SettingsActionState` & return di semua action        |
| `src/app/(dashboard)/dashboard/pages/home/_components/about-form/about-form.tsx`               | Semua field → controlled                                                 |
| `src/app/(dashboard)/dashboard/pages/home/_components/hero-form/hero-form.tsx`                 | Semua text field → controlled                                            |
| `src/app/(dashboard)/dashboard/pages/home/_components/metadata-form/metadata-form.tsx`         | Semua field → controlled                                                 |
| `src/app/(dashboard)/dashboard/pages/home/_components/nav-form/nav-form.tsx`                   | Fields `ctaBergabungLabel` & `ctaBergabungHref` → controlled             |
| `src/app/(dashboard)/dashboard/pages/home/_components/footer-form/footer-form.tsx`             | Social media fields → controlled                                         |
| `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts`                           | Tambah `values` ke `SettingsActionState` & return saat error             |
| `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/leadership-form.tsx` | Fields `periodLabel` & `heading` → controlled                            |

---

## Task 1: LoginForm — Preserve Username on Error

**Files:**

- Modify: `src/app/(dashboard)/login/_components/login-form/action.ts`
- Modify: `src/app/(dashboard)/login/_components/login-form/login-form.tsx`

- [ ] **Step 1: Update `LoginFormState` type dan return `values` saat error**

Di `action.ts`, tambah `values` ke tipe dan return-nya:

```ts
export type LoginFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  issues?: Array<{ message: string; path: PropertyKey[] }>
  values?: { username?: string }
}

const loginFormAction = async (
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> => {
  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = loginSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      issues: validatedFields.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      })),
      values: { username: rawFormData.username as string }
    }
  }
  // ... sisa kode tidak berubah
```

- [ ] **Step 2: Update `LoginForm` — username field menjadi controlled**

Di `login-form.tsx`, tambah `useState` untuk username dan gunakan `value` bukan `defaultValue`. Password field **tidak** direstore (sensitif).

```tsx
export const LoginForm = ({
  className,
  message,
  ...props
}: React.ComponentProps<'div'> & { message?: string }) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, action, isPending] = React.useActionState(loginFormAction, {})
  const [username, setUsername] = React.useState('')

  // Restore username dari state.values saat error
  React.useEffect(() => {
    if (state.values?.username) {
      setUsername(state.values.username)
    }
  }, [state.values])

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  // ... JSX lainnya sama

  // Ubah field username:
  <Input
    id='username'
    name='username'
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    placeholder='Contoh: bpk-kalteng, bph-kota-jogja, bph-uny'
    required
    aria-invalid={!!state.fieldErrors?.username || undefined}
  />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/login/_components/login-form/action.ts src/app/\(dashboard\)/login/_components/login-form/login-form.tsx
git commit -m "fix(login): preserve username input on form error"
```

---

## Task 2: AddOrganizationForm (Branches) — Preserve All Fields on Error

**Files:**

- Modify: `src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts`
- Modify: `src/app/(dashboard)/dashboard/branches/_components/add-form/add-form.tsx`

- [ ] **Step 1: Update `OrgFormState` dan return `values` saat error**

Di `action.ts`, tambah `values` ke tipe dan return saat validasi gagal di kedua fungsi:

```ts
export type OrgFormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  values?: Record<string, string>
}

// Di createOrganizationAction, ganti return validasi gagal:
if (!validated.success) {
  return {
    success: false,
    errors: validated.error.flatten().fieldErrors,
    message: 'Validasi gagal. Silakan periksa kembali inputan Anda.',
    values: rawData as Record<string, string>
  }
}

// Di updateOrganizationAction, sama — rawData sudah ada, tambah values:
if (!validated.success) {
  return {
    success: false,
    errors: validated.error.flatten().fieldErrors,
    message: 'Validasi gagal. Silakan periksa kembali inputan Anda.',
    values: { ...rawData, id } as Record<string, string>
  }
}
```

- [ ] **Step 2: Update `AddOrganizationForm` — semua text field menjadi controlled**

Di `add-form.tsx`, tambah state untuk tiap field dan gunakan `value` + `onChange`. Untuk `Select`, gunakan `value` dengan state:

```tsx
export const AddOrganizationForm = ({
  parentOrg,
  editData,
  onClose
}: {
  parentOrg: Organization
  editData?: Organization | null
  onClose: () => void
}) => {
  const [logoPath, setLogoPath] = React.useState<string | undefined>(
    editData?.logo ?? undefined
  )
  const [state, action, isPending] = React.useActionState(
    async (prevState: OrgFormState, formData: FormData) => {
      if (editData) {
        return updateOrganizationAction(prevState, formData)
      }
      return createOrganizationAction(prevState, formData)
    },
    { success: false } as OrgFormState
  )

  // Controlled state untuk semua text field
  const [name, setName] = React.useState(editData?.name ?? '')
  const [code, setCode] = React.useState(editData?.code ?? '')
  const [slug, setSlug] = React.useState(editData?.slug ?? '')
  const [type, setType] = React.useState(editData?.type ?? '')

  // Restore dari state.values saat error
  React.useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.name) setName(state.values.name)
      if (state.values.code) setCode(state.values.code)
      if (state.values.slug) setSlug(state.values.slug)
      if (state.values.type) setType(state.values.type)
    }
  }, [state.values, state.success])

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      orgSheetStore.set(false)
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state])

  // ... childTypes & availableTypes tidak berubah

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='parentId' value={parentOrg.id} />
      {editData && <input type='hidden' name='id' value={editData.id} />}

      <FieldGroup>
        <Field data-invalid={!!state.errors?.name || undefined}>
          <FieldLabel htmlFor='name'>Nama Organisasi</FieldLabel>
          <Input
            id='name'
            name='name'
            placeholder='Contoh: Pengurus Daerah Jakarta'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-invalid={!!state.errors?.name || undefined}
          />
          <FieldError
            errors={state.errors?.name?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.code || undefined}>
          <FieldLabel htmlFor='code'>Kode Organisasi</FieldLabel>
          <Input
            id='code'
            name='code'
            placeholder='Contoh: PD-JKT'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            aria-invalid={!!state.errors?.code || undefined}
          />
          <FieldError
            errors={state.errors?.code?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.type || undefined}>
          <FieldLabel htmlFor='type'>Tipe Organisasi</FieldLabel>
          <Select name='type' value={type} onValueChange={setType}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Pilih tipe' />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            errors={state.errors?.type?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field data-invalid={!!state.errors?.slug || undefined}>
          <FieldLabel htmlFor='slug'>Slug</FieldLabel>
          <Input
            id='slug'
            name='slug'
            placeholder='slug-organisasi'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            aria-invalid={!!state.errors?.slug || undefined}
          />
          <FieldError
            errors={state.errors?.slug?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field>
          <ImageUpload
            label='Logo Wilayah'
            folder='logos'
            value={logoPath}
            onChange={(path) => setLogoPath(path)}
          />
          <input type='hidden' name='logo' value={logoPath || ''} />
        </Field>

        <div className='flex justify-end gap-3 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => orgSheetStore.set(false)}
          >
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className='animate-spin'
                data-icon='inline-start'
              />
            )}
            {isPending ? 'Menyimpan...' : 'Simpan Organisasi'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/branches/_components/add-form/action.ts src/app/\(dashboard\)/dashboard/branches/_components/add-form/add-form.tsx
git commit -m "fix(branches): preserve form values on validation error"
```

---

## Task 3: TrainingForm — Preserve `name` dan `registrationDeadline` on Error

**Files:**

- Modify: `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.ts`
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/form.tsx`

- [ ] **Step 1: Update `ActionResponse` dan return `values` saat error**

Di `action.ts`, tambah `values` ke tipe dan return saat validasi gagal:

```ts
type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
  values?: Record<string, string>
}

// Di createTrainingAction, ganti return validasi gagal:
if (!validated.success) {
  return {
    success: false,
    message: 'Validation failed',
    errors: validated.error.flatten().fieldErrors,
    values: rawData as Record<string, string>
  }
}
```

- [ ] **Step 2: Update `TrainingForm` — `name` dan `registrationDeadline` menjadi controlled**

Di `form.tsx`, tambah `name` dan `registrationDeadline` ke state. Field lain (`orgId`, `type`, `startDate`, `endDate`, `masterId`) sudah controlled — tidak perlu diubah.

```tsx
// Tambah state baru setelah state yang sudah ada:
const [name, setName] = React.useState('')
const [registrationDeadline, setRegistrationDeadline] = React.useState('')

// Tambah useEffect untuk restore dari state.values:
React.useEffect(() => {
  if (state.values && !state.success) {
    if (state.values.name) setName(state.values.name)
    if (state.values.registrationDeadline) setRegistrationDeadline(state.values.registrationDeadline)
  }
}, [state.values, state.success])

// Ubah field 'name':
<Input
  id='name'
  name='name'
  placeholder='Contoh: DM 1 Nasional'
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

// Ubah field 'registrationDeadline':
<Input
  id='registrationDeadline'
  name='registrationDeadline'
  type='date'
  max={startDate}
  value={registrationDeadline}
  onChange={(e) => setRegistrationDeadline(e.target.value)}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/trainings/_components/add-training-modal/action.ts src/app/\(dashboard\)/dashboard/trainings/_components/add-training-modal/form.tsx
git commit -m "fix(trainings): preserve name and deadline fields on validation error"
```

---

## Task 4: Settings Action — Tambah `values` ke Semua Action (pages/home)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`

- [ ] **Step 1: Tambah `values` ke `SettingsActionState` dan return di setiap action yang error**

Ganti seluruh file `action.ts` dengan versi yang sudah memiliki `values`. Type dan setiap action yang return `fieldErrors` perlu juga return `values`:

```ts
export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}
```

Kemudian di setiap action yang melakukan `safeParse`, tambah `values` ke return error. Contoh pola untuk `saveHeroAction`:

```ts
export const saveHeroAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  if (!(await checkAccess())) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const result = heroSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: raw as Record<string, string>
    }
  }
  // ... sisa tidak berubah
}
```

Terapkan pola yang sama untuk: `saveAboutAction`, `saveMetadataAction`, `saveNavAction`, `saveFooterAction`.

Untuk `saveActionsAction` dan `saveNavAction` yang menggunakan JSON.parse untuk field kompleks (programs, navLinks, dll.) — field tersebut sudah dikelola sebagai controlled state di form, jadi cukup tambah `values` berisi field-field text biasa saja (bukan JSON).

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/action.ts
git commit -m "fix(pages/home): add values to SettingsActionState for error preservation"
```

---

## Task 5: AboutForm — Semua Field Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/about-form/about-form.tsx`

- [ ] **Step 1: Tambah controlled state dan restore dari `state.values`**

Ganti `defaultValue` dengan `value`+`onChange` untuk semua field. Gunakan `state.values` sebagai fallback setelah error, dengan `initialData` sebagai nilai awal:

```tsx
export const AboutForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveAboutAction, {})

  const [paragraph1, setParagraph1] = useState(initialData.paragraph1)
  const [paragraph2, setParagraph2] = useState(initialData.paragraph2)
  const [readMoreLabel, setReadMoreLabel] = useState(initialData.readMoreLabel)
  const [readMoreHref, setReadMoreHref] = useState(initialData.readMoreHref)
  const [miniStrategiTitle, setMiniStrategiTitle] = useState(
    initialData.miniStrategiTitle
  )
  const [miniStrategiDescription, setMiniStrategiDescription] = useState(
    initialData.miniStrategiDescription
  )
  const [miniStrategiLinkLabel, setMiniStrategiLinkLabel] = useState(
    initialData.miniStrategiLinkLabel
  )
  const [miniStrategiLinkHref, setMiniStrategiLinkHref] = useState(
    initialData.miniStrategiLinkHref
  )

  useEffect(() => {
    if (state.success) toast.success('Pengaturan tentang berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  // Restore values saat error
  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.paragraph1 !== undefined)
        setParagraph1(state.values.paragraph1)
      if (state.values.paragraph2 !== undefined)
        setParagraph2(state.values.paragraph2)
      if (state.values.readMoreLabel !== undefined)
        setReadMoreLabel(state.values.readMoreLabel)
      if (state.values.readMoreHref !== undefined)
        setReadMoreHref(state.values.readMoreHref)
      if (state.values.miniStrategiTitle !== undefined)
        setMiniStrategiTitle(state.values.miniStrategiTitle)
      if (state.values.miniStrategiDescription !== undefined)
        setMiniStrategiDescription(state.values.miniStrategiDescription)
      if (state.values.miniStrategiLinkLabel !== undefined)
        setMiniStrategiLinkLabel(state.values.miniStrategiLinkLabel)
      if (state.values.miniStrategiLinkHref !== undefined)
        setMiniStrategiLinkHref(state.values.miniStrategiLinkHref)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className='space-y-8'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='paragraph1'>Paragraf 1</FieldLabel>
          <FieldContent>
            <Textarea
              id='paragraph1'
              name='paragraph1'
              value={paragraph1}
              onChange={(e) => setParagraph1(e.target.value)}
              rows={4}
              placeholder='KAMMI adalah wadah perjuangan...'
            />
          </FieldContent>
          <FieldError errors={fe.paragraph1?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='paragraph2'>Paragraf 2</FieldLabel>
          <FieldContent>
            <Textarea
              id='paragraph2'
              name='paragraph2'
              value={paragraph2}
              onChange={(e) => setParagraph2(e.target.value)}
              rows={3}
              placeholder='Didirikan pada 1998...'
            />
          </FieldContent>
          <FieldError errors={fe.paragraph2?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='readMoreLabel'>
              Label Tautan &quot;Lebih Jauh&quot;
            </FieldLabel>
            <FieldContent>
              <Input
                id='readMoreLabel'
                name='readMoreLabel'
                value={readMoreLabel}
                onChange={(e) => setReadMoreLabel(e.target.value)}
                placeholder='Lebih jauh tentang kami'
              />
            </FieldContent>
            <FieldError
              errors={fe.readMoreLabel?.map((m) => ({ message: m }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='readMoreHref'>Link Tautan</FieldLabel>
            <FieldContent>
              <Input
                id='readMoreHref'
                name='readMoreHref'
                value={readMoreHref}
                onChange={(e) => setReadMoreHref(e.target.value)}
                placeholder='#organisasi'
              />
            </FieldContent>
            <FieldError
              errors={fe.readMoreHref?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Card Mini Strategi
          </p>
          <div className='space-y-4'>
            <Field>
              <FieldLabel htmlFor='miniStrategiTitle'>Judul Card</FieldLabel>
              <FieldContent>
                <Input
                  id='miniStrategiTitle'
                  name='miniStrategiTitle'
                  value={miniStrategiTitle}
                  onChange={(e) => setMiniStrategiTitle(e.target.value)}
                  placeholder='Mini Strategi'
                />
              </FieldContent>
              <FieldError
                errors={fe.miniStrategiTitle?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='miniStrategiDescription'>
                Deskripsi Card
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id='miniStrategiDescription'
                  name='miniStrategiDescription'
                  value={miniStrategiDescription}
                  onChange={(e) => setMiniStrategiDescription(e.target.value)}
                  rows={3}
                  placeholder='Membangun kader yang memiliki...'
                />
              </FieldContent>
              <FieldError
                errors={fe.miniStrategiDescription?.map((m) => ({
                  message: m
                }))}
              />
            </Field>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='miniStrategiLinkLabel'>
                  Label Link Card
                </FieldLabel>
                <FieldContent>
                  <Input
                    id='miniStrategiLinkLabel'
                    name='miniStrategiLinkLabel'
                    value={miniStrategiLinkLabel}
                    onChange={(e) => setMiniStrategiLinkLabel(e.target.value)}
                    placeholder='Selengkapnya'
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor='miniStrategiLinkHref'>
                  Link Card
                </FieldLabel>
                <FieldContent>
                  <Input
                    id='miniStrategiLinkHref'
                    name='miniStrategiLinkHref'
                    value={miniStrategiLinkHref}
                    onChange={(e) => setMiniStrategiLinkHref(e.target.value)}
                    placeholder='#strategi'
                  />
                </FieldContent>
              </Field>
            </div>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Tentang'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Tambah `useState` ke import**

Pastikan baris import di atas file menyertakan `useState`:

```tsx
import { useActionState, useEffect, useState } from 'react'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/about-form/about-form.tsx
git commit -m "fix(pages/home): preserve about form values on validation error"
```

---

## Task 6: HeroForm — Semua Text Field Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/hero-form/hero-form.tsx`

- [ ] **Step 1: Tambah controlled state untuk semua field dan restore dari `state.values`**

`heroImageUrl` sudah controlled. Tambah state untuk semua field teks. Import `useState` sudah ada.

```tsx
export const HeroForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveHeroAction, {})
  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl)
  const [badgeText, setBadgeText] = useState(initialData.badgeText)
  const [title, setTitle] = useState(initialData.title)
  const [titleAccent, setTitleAccent] = useState(initialData.titleAccent)
  const [subtitle, setSubtitle] = useState(initialData.subtitle)
  const [heroImageAlt, setHeroImageAlt] = useState(initialData.heroImageAlt)
  const [quoteText, setQuoteText] = useState(initialData.quoteText)
  const [quoteAttribution, setQuoteAttribution] = useState(
    initialData.quoteAttribution
  )
  const [cta1Label, setCta1Label] = useState(initialData.cta1Label)
  const [cta1Href, setCta1Href] = useState(initialData.cta1Href)
  const [cta2Label, setCta2Label] = useState(initialData.cta2Label)
  const [cta2Href, setCta2Href] = useState(initialData.cta2Href)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan hero berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  // Restore values saat error
  useEffect(() => {
    if (state.values && !state.success) {
      const v = state.values
      if (v.badgeText !== undefined) setBadgeText(v.badgeText)
      if (v.title !== undefined) setTitle(v.title)
      if (v.titleAccent !== undefined) setTitleAccent(v.titleAccent)
      if (v.subtitle !== undefined) setSubtitle(v.subtitle)
      if (v.heroImageUrl !== undefined) setHeroImageUrl(v.heroImageUrl)
      if (v.heroImageAlt !== undefined) setHeroImageAlt(v.heroImageAlt)
      if (v.quoteText !== undefined) setQuoteText(v.quoteText)
      if (v.quoteAttribution !== undefined)
        setQuoteAttribution(v.quoteAttribution)
      if (v.cta1Label !== undefined) setCta1Label(v.cta1Label)
      if (v.cta1Href !== undefined) setCta1Href(v.cta1Href)
      if (v.cta2Label !== undefined) setCta2Label(v.cta2Label)
      if (v.cta2Href !== undefined) setCta2Href(v.cta2Href)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form
      action={(fd) => {
        fd.set('heroImageUrl', heroImageUrl)
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='badgeText'>Teks Badge</FieldLabel>
          <FieldContent>
            <Input
              id='badgeText'
              name='badgeText'
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia'
            />
          </FieldContent>
          <FieldError errors={fe.badgeText?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='title'>Judul Utama</FieldLabel>
            <FieldContent>
              <Input
                id='title'
                name='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Pelopor Kebaikan'
              />
            </FieldContent>
            <FieldError errors={fe.title?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='titleAccent'>Kata Aksen (merah)</FieldLabel>
            <FieldContent>
              <Input
                id='titleAccent'
                name='titleAccent'
                value={titleAccent}
                onChange={(e) => setTitleAccent(e.target.value)}
                placeholder='untuk'
              />
            </FieldContent>
            <FieldError errors={fe.titleAccent?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor='subtitle'>Subjudul / Paragraf Hero</FieldLabel>
          <FieldContent>
            <Textarea
              id='subtitle'
              name='subtitle'
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={3}
              placeholder='Membangun peradaban dengan...'
            />
          </FieldContent>
          <FieldError errors={fe.subtitle?.map((m) => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel>Foto Hero</FieldLabel>
            <FieldContent>
              <ImageUpload
                value={heroImageUrl}
                onChange={setHeroImageUrl}
                folder='site-settings/hero'
              />
            </FieldContent>
            <FieldError
              errors={fe.heroImageUrl?.map((m) => ({ message: m }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='heroImageAlt'>Alt Text Foto</FieldLabel>
            <FieldContent>
              <Input
                id='heroImageAlt'
                name='heroImageAlt'
                value={heroImageAlt}
                onChange={(e) => setHeroImageAlt(e.target.value)}
                placeholder='Deskripsi foto untuk aksesibilitas'
              />
            </FieldContent>
            <FieldError
              errors={fe.heroImageAlt?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='quoteText'>Teks Kutipan Mengambang</FieldLabel>
            <FieldContent>
              <Textarea
                id='quoteText'
                name='quoteText'
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={2}
                placeholder='Seperti akar yang menancap dalam...'
              />
            </FieldContent>
            <FieldError errors={fe.quoteText?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='quoteAttribution'>Atribusi Kutipan</FieldLabel>
            <FieldContent>
              <Input
                id='quoteAttribution'
                name='quoteAttribution'
                value={quoteAttribution}
                onChange={(e) => setQuoteAttribution(e.target.value)}
                placeholder='Semangat KAMMI'
              />
            </FieldContent>
            <FieldError
              errors={fe.quoteAttribution?.map((m) => ({ message: m }))}
            />
          </Field>
        </div>

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>Tombol CTA</p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='cta1Label'>
                Label Tombol 1 (Utama)
              </FieldLabel>
              <FieldContent>
                <Input
                  id='cta1Label'
                  name='cta1Label'
                  value={cta1Label}
                  onChange={(e) => setCta1Label(e.target.value)}
                  placeholder='Mulai Bergabung'
                />
              </FieldContent>
              <FieldError errors={fe.cta1Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta1Href'>Link Tombol 1</FieldLabel>
              <FieldContent>
                <Input
                  id='cta1Href'
                  name='cta1Href'
                  value={cta1Href}
                  onChange={(e) => setCta1Href(e.target.value)}
                  placeholder='#bergabung'
                />
              </FieldContent>
              <FieldError errors={fe.cta1Href?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Label'>
                Label Tombol 2 (Outline)
              </FieldLabel>
              <FieldContent>
                <Input
                  id='cta2Label'
                  name='cta2Label'
                  value={cta2Label}
                  onChange={(e) => setCta2Label(e.target.value)}
                  placeholder='Pelajari Visi'
                />
              </FieldContent>
              <FieldError errors={fe.cta2Label?.map((m) => ({ message: m }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor='cta2Href'>Link Tombol 2</FieldLabel>
              <FieldContent>
                <Input
                  id='cta2Href'
                  name='cta2Href'
                  value={cta2Href}
                  onChange={(e) => setCta2Href(e.target.value)}
                  placeholder='#tentang'
                />
              </FieldContent>
              <FieldError errors={fe.cta2Href?.map((m) => ({ message: m }))} />
            </Field>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Hero'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/hero-form/hero-form.tsx
git commit -m "fix(pages/home): preserve hero form values on validation error"
```

---

## Task 7: MetadataForm — Semua Field Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/metadata-form/metadata-form.tsx`

- [ ] **Step 1: Tambah controlled state dan restore dari `state.values`**

```tsx
import { useActionState, useEffect, useState } from 'react'
// ... import lainnya sama

export const MetadataForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveMetadataAction, {})

  const [pageTitle, setPageTitle] = useState(initialData.pageTitle)
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription
  )
  const [ogImageUrl, setOgImageUrl] = useState(initialData.ogImageUrl)

  useEffect(() => {
    if (state.success) toast.success('Metadata halaman berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.pageTitle !== undefined)
        setPageTitle(state.values.pageTitle)
      if (state.values.metaDescription !== undefined)
        setMetaDescription(state.values.metaDescription)
      if (state.values.ogImageUrl !== undefined)
        setOgImageUrl(state.values.ogImageUrl)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className='space-y-8'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='pageTitle'>Judul Halaman (Title Tag)</FieldLabel>
          <FieldContent>
            <Input
              id='pageTitle'
              name='pageTitle'
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder='KAMMI.id — Pelopor Kebaikan untuk Indonesia'
            />
          </FieldContent>
          <FieldDescription>
            Muncul di tab browser dan hasil pencarian Google.
          </FieldDescription>
          <FieldError errors={fe.pageTitle?.map((m) => ({ message: m }))} />
        </Field>

        <Field>
          <FieldLabel htmlFor='metaDescription'>Deskripsi Meta</FieldLabel>
          <FieldContent>
            <Textarea
              id='metaDescription'
              name='metaDescription'
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder='Kesatuan Aksi Mahasiswa Muslim Indonesia...'
            />
          </FieldContent>
          <FieldDescription>
            Ideal 150-160 karakter. Ditampilkan di hasil pencarian.
          </FieldDescription>
          <FieldError
            errors={fe.metaDescription?.map((m) => ({ message: m }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='ogImageUrl'>
            URL Gambar OG (Open Graph)
          </FieldLabel>
          <FieldContent>
            <Input
              id='ogImageUrl'
              name='ogImageUrl'
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder='/assets/logo.png atau https://...'
            />
          </FieldContent>
          <FieldDescription>
            Gambar yang muncul saat halaman dibagikan di WhatsApp, Twitter, dll.
            Ukuran ideal 1200x630px.
          </FieldDescription>
          <FieldError errors={fe.ogImageUrl?.map((m) => ({ message: m }))} />
        </Field>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Metadata'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/metadata-form/metadata-form.tsx
git commit -m "fix(pages/home): preserve metadata form values on validation error"
```

---

## Task 8: NavForm — `ctaBergabungLabel` dan `ctaBergabungHref` Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/nav-form/nav-form.tsx`

- [ ] **Step 1: Tambah controlled state untuk CTA fields dan restore dari `state.values`**

`navLinks` sudah controlled. Tambah state untuk 2 field yang masih `defaultValue`:

```tsx
export const NavForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveNavAction, {})
  const [navLinks, setNavLinks] = useState<NavLink[]>(initialData.navLinks)
  const [ctaBergabungLabel, setCtaBergabungLabel] = useState(
    initialData.ctaBergabungLabel
  )
  const [ctaBergabungHref, setCtaBergabungHref] = useState(
    initialData.ctaBergabungHref
  )

  useEffect(() => {
    if (state.success) toast.success('Pengaturan navigasi berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.ctaBergabungLabel !== undefined)
        setCtaBergabungLabel(state.values.ctaBergabungLabel)
      if (state.values.ctaBergabungHref !== undefined)
        setCtaBergabungHref(state.values.ctaBergabungHref)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  return (
    <form
      action={(fd) => {
        fd.set('navLinks', JSON.stringify(navLinks))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <LinkListEditor
          links={navLinks}
          onChange={setNavLinks}
          label='Menu Navigasi Utama'
        />

        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Tombol CTA Navbar
          </p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='ctaBergabungLabel'>Label Tombol</FieldLabel>
              <FieldContent>
                <Input
                  id='ctaBergabungLabel'
                  name='ctaBergabungLabel'
                  value={ctaBergabungLabel}
                  onChange={(e) => setCtaBergabungLabel(e.target.value)}
                  placeholder='Bergabung di KAMMI'
                />
              </FieldContent>
              <FieldError
                errors={fe.ctaBergabungLabel?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='ctaBergabungHref'>Link Tombol</FieldLabel>
              <FieldContent>
                <Input
                  id='ctaBergabungHref'
                  name='ctaBergabungHref'
                  value={ctaBergabungHref}
                  onChange={(e) => setCtaBergabungHref(e.target.value)}
                  placeholder='#bergabung'
                />
              </FieldContent>
              <FieldError
                errors={fe.ctaBergabungHref?.map((m) => ({ message: m }))}
              />
            </Field>
          </div>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Navigasi'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/nav-form/nav-form.tsx
git commit -m "fix(pages/home): preserve nav CTA fields on validation error"
```

---

## Task 9: FooterForm — Social Media Fields Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/footer-form/footer-form.tsx`

- [ ] **Step 1: Tambah controlled state untuk social fields dan restore dari `state.values`**

Link list (footerKAMMI, footerBeritaData, footerIkutiKami) sudah controlled. Tambah state untuk 4 social media fields:

```tsx
export const FooterForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveFooterAction, {})
  const [footerKAMMI, setFooterKAMMI] = useState(initialData.footerKAMMI)
  const [footerBeritaData, setFooterBeritaData] = useState(
    initialData.footerBeritaData
  )
  const [footerIkutiKami, setFooterIkutiKami] = useState(
    initialData.footerIkutiKami
  )
  const [socialIG, setSocialIG] = useState(initialData.socialIG)
  const [socialTwitter, setSocialTwitter] = useState(initialData.socialTwitter)
  const [socialYoutube, setSocialYoutube] = useState(initialData.socialYoutube)
  const [socialTelegram, setSocialTelegram] = useState(
    initialData.socialTelegram
  )

  useEffect(() => {
    if (state.success) toast.success('Pengaturan footer berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.socialIG !== undefined)
        setSocialIG(state.values.socialIG)
      if (state.values.socialTwitter !== undefined)
        setSocialTwitter(state.values.socialTwitter)
      if (state.values.socialYoutube !== undefined)
        setSocialYoutube(state.values.socialYoutube)
      if (state.values.socialTelegram !== undefined)
        setSocialTelegram(state.values.socialTelegram)
    }
  }, [state.values, state.success])

  return (
    <form
      action={(fd) => {
        fd.set('footerKAMMI', JSON.stringify(footerKAMMI))
        fd.set('footerBeritaData', JSON.stringify(footerBeritaData))
        fd.set('footerIkutiKami', JSON.stringify(footerIkutiKami))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='border-border bg-muted/40 rounded-2xl border p-5'>
          <p className='text-foreground mb-4 text-sm font-medium'>
            Tautan Media Sosial
          </p>
          <FieldDescription className='mb-4'>
            Isi URL lengkap atau biarkan kosong untuk menyembunyikan ikon.
          </FieldDescription>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[
              {
                name: 'socialIG',
                label: 'Instagram',
                value: socialIG,
                onChange: setSocialIG
              },
              {
                name: 'socialTwitter',
                label: 'Twitter / X',
                value: socialTwitter,
                onChange: setSocialTwitter
              },
              {
                name: 'socialYoutube',
                label: 'YouTube',
                value: socialYoutube,
                onChange: setSocialYoutube
              },
              {
                name: 'socialTelegram',
                label: 'Telegram',
                value: socialTelegram,
                onChange: setSocialTelegram
              }
            ].map(({ name, label, value, onChange }) => (
              <Field key={name}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <FieldContent>
                  <Input
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder='https://...'
                  />
                </FieldContent>
              </Field>
            ))}
          </div>
        </div>

        <LinkListEditor
          links={footerKAMMI}
          onChange={setFooterKAMMI}
          label='Kolom Footer: KAMMI'
        />
        <LinkListEditor
          links={footerBeritaData}
          onChange={setFooterBeritaData}
          label='Kolom Footer: Berita & Data'
        />
        <LinkListEditor
          links={footerIkutiKami}
          onChange={setFooterIkutiKami}
          label='Kolom Footer: Ikuti Kami'
        />
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Footer'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/footer-form/footer-form.tsx
git commit -m "fix(pages/home): preserve footer social fields on validation error"
```

---

## Task 10: Managers Action + LeadershipForm — `periodLabel` dan `heading` Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts`
- Modify: `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/leadership-form.tsx`

- [ ] **Step 1: Baca dan update action.ts managers**

Baca file `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts` terlebih dulu, lalu tambah `values` ke `SettingsActionState` di sana dan return-nya saat validasi gagal (pola sama dengan Task 4):

```ts
// Tambah values ke return error di saveLeadershipAction:
if (!result.success) {
  return {
    fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    values: {
      periodLabel: raw.periodLabel as string,
      heading: raw.heading as string
    }
  }
}
```

- [ ] **Step 2: Update `LeadershipForm` — `periodLabel` dan `heading` menjadi controlled**

`leaders` sudah controlled. Tambah state untuk 2 field teks:

```tsx
export const LeadershipForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveLeadershipAction, {})
  const [leaders, setLeaders] = useState<Leader[]>(initialData.leaders)
  const [periodLabel, setPeriodLabel] = useState(initialData.periodLabel)
  const [heading, setHeading] = useState(initialData.heading)

  useEffect(() => {
    if (state.success)
      toast.success('Pengaturan kepemimpinan berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.periodLabel !== undefined)
        setPeriodLabel(state.values.periodLabel)
      if (state.values.heading !== undefined) setHeading(state.values.heading)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  // ... updateLeader, addLeader, removeLeader tidak berubah

  return (
    <form
      action={(fd) => {
        fd.set('leaders', JSON.stringify(leaders))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='periodLabel'>Label Periode</FieldLabel>
            <FieldContent>
              <Input
                id='periodLabel'
                name='periodLabel'
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder='Masa Jabatan KAMMI'
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='heading'
                name='heading'
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder='Mengenal Pengurus Pusat KAMMI'
              />
            </FieldContent>
            <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        {/* ... Daftar Pengurus dan tombol tambah tidak berubah */}
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Kepemimpinan'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/managers/_components/action.ts src/app/\(dashboard\)/dashboard/pages/managers/_components/leadership-form/leadership-form.tsx
git commit -m "fix(pages/managers): preserve leadership form values on validation error"
```

---

## Task 11: ActionsForm — `heading` dan `subheading` Menjadi Controlled

**Files:**

- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/actions-form/actions-form.tsx`

- [ ] **Step 1: Tambah controlled state untuk `heading` dan `subheading` dan restore dari `state.values`**

`programs` sudah controlled. Tambah state untuk 2 field teks yang masih `defaultValue`:

```tsx
export const ActionsForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveActionsAction, {})
  const [programs, setPrograms] = useState<Program[]>(initialData.programs)
  const [heading, setHeading] = useState(initialData.heading)
  const [subheading, setSubheading] = useState(initialData.subheading)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan aksi berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.heading !== undefined) setHeading(state.values.heading)
      if (state.values.subheading !== undefined)
        setSubheading(state.values.subheading)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  // ... updateProgram, addProgram, removeProgram tidak berubah

  return (
    <form
      action={(fd) => {
        fd.set('programs', JSON.stringify(programs))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='heading'
                name='heading'
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder='Aksi Nyata KAMMI Untuk Indonesia'
              />
            </FieldContent>
            <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='subheading'>Subjudul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='subheading'
                name='subheading'
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder='Manifestasi intelektualitas...'
              />
            </FieldContent>
          </Field>
        </div>

        {/* ... Daftar programs tidak berubah */}
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Aksi'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/actions-form/actions-form.tsx
git commit -m "fix(pages/home): preserve actions form heading/subheading on validation error"
```

---

## Catatan: Form yang Tidak Perlu Diubah

- **`AccountForm`** — sudah fully controlled dengan `useState` dan pre-filled dari `initialData`.
- **`PasswordForm`** — semua field sensitif, dikosongkan saat error adalah behavior yang benar.
- **`AddMemberForm` + `PersonalInfoSection`** — sudah ada logic restore `state?.values` di render phase. Text fields (`name`, `phone`, `yearOfEntry`) sudah menggunakan `defaultValue` dengan fallback `state?.values?.fieldName`, yang bekerja karena komponen di-unmount dan di-mount ulang saat step berganti. Tidak perlu diubah.
- **`NavForm` `LinkListEditor`** — link list sudah fully controlled.
- **`FooterForm` `LinkListEditor`** — sama, sudah controlled.
- **`LeadershipForm` leaders list** — sudah controlled via `useState`.
- **`ActionsForm` programs list** — sudah controlled via `useState`.
