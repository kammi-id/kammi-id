# Kader & Daurah Improvements

## 1 & 2. Edit Mode untuk tabel kader yang sudah ada

**Masalah:** Tabel daftar kader (`individual-table`) hanya read-only. BPK/root tidak bisa
memperbaiki data kader yang sudah diinput (termasuk memindahkan organisasi tempat
kader terdaftar) tanpa membuka form terpisah.

**Solusi:**
- State global baru di `add-form/store.ts`:
  - `isEditModeStore: atom<boolean>` — toggle edit mode untuk tabel kader saat ini.
  - `editedRowsStore: map<string, Partial<IndividualMember>>` — perubahan per memberId
    untuk existing rows.
- `individual-table.tsx`:
  - `isEditMode = false` (default): tabel read-only seperti sekarang. Baris
    "Tambah Kader" (`InlineQuickAddRow`) disembunyikan. `actionElement` hanya
    menampilkan tombol **"Edit"** (canManage & type yang diizinkan saja, sama
    seperti kondisi existing untuk menampilkan tombol simpan).
  - `isEditMode = true`:
    - `InlineQuickAddRow` ditampilkan (baris "Tambah Kader").
    - Tombol **"Batal"** muncul — reset `editedRowsStore`, `inlineMembersStore`,
      lalu set `isEditModeStore` ke `false`.
    - Tombol aksi utama berubah jadi **"Simpan"** — submit baris existing yang
      berubah (via `updateMemberAction`, satu panggilan per row yang diubah,
      mengirim seluruh field member + perubahan sebagai FormData, mengikuti pola
      `handleSave` yang sudah ada untuk inline rows) **dan** baris baru
      (flow `createMemberAction` existing). Setelah sukses: clear
      `editedRowsStore`, `clearInlineRows()`, set `isEditModeStore` ke `false`.
- `columns.tsx` (individual-table): saat `isEditMode = true`, render cell sebagai
  input/select/checkbox (pola sama dengan `InlineRow` di `inline-quick-add-row.tsx`):
  - Nama → text input
  - Jenjang (status) → select AB1/AB2/AB3
  - Jenis Kelamin → select
  - Pemandu / Instruktur → checkbox
  - No. HP → text input
  - Tahun Masuk KAMMI → number input (pakai logic clamp yang sudah ada)
  - Kolom organisasi (Komisariat, atau Daerah untuk halaman PD) → combobox
    `organizationId`, opsi dibatasi ke descendant `parentOrgId` (reuse
    `getDescendantIds` dari `inline-quick-add-row.tsx`, **scope tidak diperluas**).
    Untuk halaman dengan `orgType === 'pk'`, kolom organisasi tidak ditampilkan/
    tidak editable (member sudah pasti di PK tersebut, sama seperti
    `InlineQuickAddRow`).
  - NIA (registerNumber) tetap read-only.
  - Perubahan ditulis ke `editedRowsStore` (bukan langsung ke `data`), dibaca
    sebagai override saat render cell.

## 3. Tempat & Tanggal Lahir

- Tambah kolom `birthPlace` (text, nullable) dan `birthDate` (date, nullable) di
  `src/db/schema/member.sql.ts` + migration baru.
- Tambah field input "Tempat Lahir" (text) dan "Tanggal Lahir" (date) di:
  - `add-form/personal-info-section.tsx` (form tambah/edit kader oleh BPK)
  - `profile-info.tsx` edit-mode (form edit profil kader sendiri)
- Tampilkan di halaman detail kader, section "Data Diri" (`profile-info.tsx`
  view-mode), format "Tempat, Tanggal Lahir" jika keduanya ada.
- Tambah `birthPlace`/`birthDate` ke zod schema di `add-form/action.ts` dan
  `profile/[registerNumber]/_components/action.ts`, serta ke insert/update query
  member.

## 4. Rename "Sertifikasi" → "Perangkat Pengkaderan"

- Ubah label section di `profile-sidebar.tsx` (edit-mode dan view-mode, baris
  ~208 dan ~239) dari "Sertifikasi" menjadi "Perangkat Pengkaderan".

## 5. Rename "Dauroh" → "Daurah" (global, UI only)

- Cari-ganti semua string user-facing "Dauroh"/"dauroh" → "Daurah"/"daurah" di
  seluruh file yang ditemukan (breadcrumb, judul form, badge, label sidebar,
  log message, dsb). Nama variabel/field/schema/tabel (`training`, dll) **tidak**
  diubah.

## 6. Restrukturisasi label & field tanggal pendaftaran Daurah

- Tambah kolom `registrationStartDate` (date, nullable) di
  `src/db/schema/training.sql.ts` + migration baru.
- `add-training-modal/form.tsx`:
  - "Tanggal Mulai" → **"Tanggal Mulai Pelaksanaan"** (startDate)
  - "Tanggal Selesai" → **"Tanggal Selesai Pelaksanaan"** (endDate)
  - "Deadline Pendaftaran" → **"Tanggal Akhir Pendaftaran"** (registrationDeadline)
  - Tambah field baru **"Tanggal Mulai Pendaftaran"** (registrationStartDate),
    opsional, ditempatkan sebelum "Tanggal Akhir Pendaftaran"
- `add-training-modal/action.ts`:
  - Tambah `registrationStartDate` ke `TrainingSchema` (optional date string)
  - Validasi urutan: `registrationStartDate <= registrationDeadline <= startDate`
    (jika field-field tersebut diisi), selain validasi `endDate >= startDate`
    yang sudah ada
- `src/db/query/training.ts`: tambahkan `registrationStartDate` ke
  select/create/update (`TrainingCreateInput`, `TrainingUpdateInput`, dan tipe
  hasil query yang relevan)
- `training-detail-view/action.ts`: tambah `registrationStartDate` ke
  `UpdateTrainingSchema` + validasi urutan tanggal yang sama
- `training-detail-view.tsx`: tampilkan rentang tanggal pendaftaran (mulai–akhir)
  jika `registrationStartDate` dan/atau `registrationDeadline` ada, dengan label
  yang konsisten ("Pendaftaran")
- `training-table/columns.tsx`, `training-grid`: sesuaikan label tanggal sesuai
  rename di atas (tidak perlu menambah kolom baru jika tidak menampilkan tanggal
  pendaftaran saat ini — fokus pada konsistensi rename "Dauroh"→"Daurah" dan
  label tanggal pelaksanaan jika ditampilkan)

## Migrations

Dua migration baru diperlukan:
1. `member`: tambah `birth_place text`, `birth_date date`
2. `training`: tambah `registration_start_date date`

Gunakan `drizzle-kit generate` sesuai konvensi project (lihat folder
`src/db/__migrations`).
