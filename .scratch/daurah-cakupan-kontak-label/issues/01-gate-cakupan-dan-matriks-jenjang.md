# 01 — Pembuatan Daurah tidak menegakkan Cakupan, dan tidak mengenal Jenjang

**What to build:** gate `requireDaurahAccess(organizationId)` yang menegakkan
Cakupan, plus penegakan matriks Jenis Daurah × Jenjang penyelenggara di
pembuatan dan penggantian jenis.

**Blocked by:** None — can start immediately.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

## Lubangnya

`requireDaurahCreationAccess` (`src/lib/auth/daurah.ts`) hanya memeriksa
`role === 'root' || role === 'bpk'`. `organizationId` datang dari
`<input type='hidden'>` di form dan **tidak pernah** diadu dengan Cakupan
pemanggil (`add-training-modal/action.ts`). Seorang BPK PK yang mengirim id
milik PP akan diterima.

Daftar penyelenggara di UI sudah disaring `fetchAllowedOrgIds`
(`trainings/page.tsx:70`), jadi lubang ini tidak terlihat lewat layar. Server
Action adalah endpoint POST; penyaringan di sisi klien bukan gate.

Aturan kedua yang belum ada di kode sama sekali: **jenis Daurah yang boleh
diselenggarakan bergantung pada Jenjang penyelenggara**. `CONTEXT.md`
menyatakannya pada definisi **Daurah**, tapi tidak ada satu baris pun yang
menegakkannya. Matriksnya diputuskan di `docs/adr/0025`.

## Yang dikerjakan

Gate baru menerima `organizationId` sebagai **argumen wajib**, sesuai
`AGENTS.md`: Cakupan tidak pernah opsional, supaya melewatkannya jadi galat
`tsc`, bukan kebocoran diam-diam. `isOrgInAccessScope` (`db/query/organization.ts`)
sudah menjawab pertanyaannya; `readAccessScope` satu-satunya cara membangun
`AccessScope`.

Dua pintu, bukan satu:

- `createTrainingAction` — Cakupan **dan** matriks.
- `updateTrainingAction` — matriks. `UpdateTrainingSchema` mengizinkan ubah
  `type` tapi tidak `organizationId`, jadi Cakupan-nya sudah dijaga
  `assertCanManage`; yang belum dijaga adalah pindah jenis ke luar matriks.

`searchMasterCandidatesAction` di file yang sama ikut memakai gate baru: ia
menelusuri kolam Instruktur nasional dan hari ini bersandar pada gate lama yang
buta Struktur.

**Daurah lama yang melanggar matriks dibiarkan.** Aturan baru menghakimi
perbuatan baru; mengunci penyuntingan Daurah lama menghukum operator atas
keputusan yang sah saat dibuat. Per staging jumlahnya nol, tapi jangan tulis
kode yang mengandaikan itu.

UI ikut menyempit — pilihan jenis di `training-form.tsx` disaring mengikuti
Jenjang penyelenggara yang sedang terpilih — tapi server tetap satu-satunya
sumber kebenaran.

## Acceptance

- [ ] `requireDaurahAccess` menolak `organizationId` di luar Cakupan pemanggil
- [ ] Cakupan mencakup Struktur sendiri **dan** seluruh turunannya
- [ ] `root` tetap menembus batas Cakupan
- [ ] Membuat Daurah dengan jenis di luar matriks Jenjang penyelenggara ditolak
- [ ] Mengubah `type` ke luar matriks ditolak
- [ ] Menyunting Daurah lama yang sudah melanggar matriks **tidak** diblokir
      selama jenisnya tidak diubah
- [ ] `searchMasterCandidatesAction` memakai gate yang sama
- [ ] Pilihan jenis di form menyempit mengikuti penyelenggara terpilih
- [ ] Ada tes untuk tiap jalur penolakan, mengikuti pola `action.test.ts`
- [ ] `bun run check:types`, `check:lint`, `check:structure` lolos

## Comments

Dikerjakan 2026-09-07. `requireDaurahAccess(organizationId)` baru di
`src/lib/auth/daurah.ts` menegakkan Cakupan (self + turunan, `root` tembus).
Matriks ADR 0025 di `src/lib/daurah/matriks-jenis-daurah.ts`, dipakai di
`createTrainingAction`, `updateTrainingAction` (hanya saat `type` berubah),
dan `searchMasterCandidatesAction`. `training-form.tsx` menyempit mengikuti
Jenjang penyelenggara. Catatan: `updateTrainingAction` masih tanpa gerbang
Cakupan sendiri (celah pra-ada, di luar acceptance tiket ini) — lihat commit
`6762234`.
