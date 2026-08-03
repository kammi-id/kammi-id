# 01 — Dua aksi pencarian Daurah berjalan tanpa gate apa pun

**What to build:** `searchTrainingAttendantsAction` dan
`searchTrainingInstructorsAction` harus membaca sesi dan menegakkan Cakupan,
seperti aksi lain di file yang sama.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Keduanya ada di `trainings/_components/training-detail-view/action.ts:457` dan
`:471`. Isinya hanya `try` → panggil query → balikkan hasil. Tidak ada
`readActiveSession`, tidak ada `assertCanManage`, tidak ada pengecekan Cakupan.
Setiap aksi lain di file itu punya gate; dua ini terlewat.

**Ini bukan endpoint internal.** Server Action adalah endpoint POST. Siapa pun
yang tahu id aksinya bisa memanggilnya langsung, tanpa lewat UI. Dua aksi ini
mengembalikan nama Kader beserta datanya dari **seluruh Struktur**, bukan hanya
Cakupan pemanggil — `searchEligibleAttendants` dan `searchEligibleInstructors`
tidak memfilter apa pun berdasarkan Akun.

Gate yang tepat adalah `assertCanManage(trainingId)` yang sudah ada di file itu
— ia sudah menegakkan sesi dan Cakupan atas Daurah yang bersangkutan, dan itu
persis pertanyaannya: boleh tidak Akun ini melihat calon Peserta untuk Daurah
ini.

**Aplikasi ini sudah berjalan di production dengan data asli.** Tambahkan gate,
jangan sekalian merombak bentuk balikan kedua aksi — pemanggilnya di
`training-attendant-combobox.tsx` dan `training-instructor-combobox.tsx`
mengandalkan bentuk `{ data, success }` yang sekarang.

- [ ] Kedua aksi menolak ketika tidak ada sesi
- [ ] Kedua aksi menolak Daurah di luar Cakupan pemanggil
- [ ] Bentuk balikan `{ data, success, message? }` tidak berubah
- [ ] Combobox pemanggilnya masih berfungsi seperti sekarang
- [ ] Ada tes untuk kedua jalur penolakan, mengikuti pola `action.test.ts`
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
