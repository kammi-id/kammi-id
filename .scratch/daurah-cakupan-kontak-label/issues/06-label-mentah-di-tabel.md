# 06 — Kode mesin bocor ke tabel dan tampilan detail

**What to build:** satukan peta label yang tersalin di banyak berkas, lalu
pakai di sembilan permukaan yang masih menampilkan enum mentah.

**Blocked by:** None — can start immediately.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

## Temuannya

Sisi pemilih hampir bersih: wrapper `shadcn/ui/select.tsx:21` menurunkan
`items` dari anak `SelectItem`, jadi tidak ada trigger `<Select>` yang
menampilkan enum mentah. Yang tersisa tiga RadioGroup kartu, yang menaruh kode
sebagai judul dan label Indonesia sebagai keterangan:

- `profile/[registerNumber]/_components/profile-sidebar/profile-sidebar.tsx:157`
- `kader/_components/add-form/personal-info-section.tsx:220` (jenjang)
- `kader/_components/add-form/personal-info-section.tsx:173` (jenis kelamin)

Yang mentah justru tabel dan tampilan detail:

- `trainings/_components/training-section-cards/training-section-cards.tsx:69`
  dan `:75` — `OTHER`, bukan `Lainnya`
- `branches/_components/organization-table/organization-table.tsx:65` — `Pw`,
  `Pdln`
- `kader/_components/individual-table/columns.tsx:401` dan `:330` — jenis
  kelamin dan jenjang, `aria-label`-nya lebih mentah lagi
- `organization/page.tsx:68`
- `profile/[registerNumber]/_components/academic-section/academic-section.tsx:376`
  — `PROFESI`, padahal `degreeLabels` ada di berkas yang sama
- `profile/[registerNumber]/_components/profile-header/profile-header.tsx:112`
  dan `:122`
- `kader/_components/members-table/columns.tsx:83`

## Yang dikerjakan

Peta jenis Daurah tersalin di **lima** berkas, peta jenjang kader di empat
dengan dua ejaan berbeda. Satukan, mengikuti pola `src/lib/struktur/jenjang.ts`
yang sudah ada — `src/lib/` datar, per-domain, tanpa barrel:

- `src/lib/daurah/labels.ts` — jenis Daurah dan Peran Instruktur
- `src/lib/kader/jenjang.ts` — AB1–AB3 dan jenis kelamin

Ejaannya **`AB1`**, tanpa spasi, seperti `CONTEXT.md` dan Nomor Induk Anggota.
Hari ini `AB1` dan `AB 1` sama-sama beredar.

Fallback ke kode mentah untuk nilai yang tak terpetakan (`?? type.toUpperCase()`,
dua belas tempat) **dibiarkan** — itu jaring pengaman, bukan kebocoran.

`_components/dashboard-columns/dashboard-columns.tsx` adalah sisa tabel contoh
shadcn: header berbahasa Inggris, tidak dipakai siapa pun kecuali barrel-nya
sendiri. **Hapus**, jangan dilabeli.

`src/components/base-ui/select/base-ui-select.tsx` dan `async-select.tsx` juga
tidak diimpor dari luar foldernya. Laporkan; jangan hapus dalam tiket ini.

## Acceptance

- [ ] Dua modul label baru, tanpa salinan tersisa di berkas komponen
- [ ] Sembilan permukaan di atas menampilkan label, bukan kode
- [ ] `aria-label` di `individual-table/columns.tsx` ikut memakai label
- [ ] Tiga RadioGroup menaruh label sebagai judul kartu
- [ ] `AB1` seragam di seluruh permukaan
- [ ] `dashboard-columns/` terhapus beserta barrel-nya
- [ ] `bun run check:types`, `check:lint`, `check:structure` lolos

## Comments

Dikerjakan 2026-09-07. Dua modul baru: `src/lib/daurah/labels.ts` dan
`src/lib/kader/jenjang.ts`. Sembilan permukaan plus tiga RadioGroup memakainya,
`dashboard-columns/` terhapus. Catatan: ejaan `AB1` seragam hanya di
permukaan yang disentuh tiket ini — beberapa berkas lain (`kader-stats.tsx`,
`member-section-cards.tsx`, `kader-bento-stats.tsx`,
`inline-quick-add-row.tsx`, `member-branch-card.tsx`,
`bulk-upload-preview.tsx`) masih memakai `AB 2`/`AB 3` berspasi dan tidak ada
di daftar temuan tiket ini — kandidat tiket lanjutan. Lihat commit `ed4679e`.
