# 01 — Dua aksi pencarian Daurah berjalan tanpa gate apa pun

**What to build:** `searchTrainingAttendantsAction` dan
`searchTrainingInstructorsAction` harus membaca sesi dan menegakkan Cakupan,
seperti aksi lain di file yang sama.

**Blocked by:** None — can start immediately.

**Status:** done — 8d7ab19

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

- [x] Kedua aksi menolak ketika tidak ada sesi
- [x] Kedua aksi menolak Daurah di luar Cakupan pemanggil
- [x] Bentuk balikan `{ data, success, message? }` tidak berubah
- [x] Combobox pemanggilnya masih berfungsi seperti sekarang
- [x] Ada tes untuk kedua jalur penolakan, mengikuti pola `action.test.ts`
- [x] `bun run check:types` lolos
- [x] Seluruh tes lolos

## Comments

**Gate-nya terpasang, tapi lubangnya tidak tertutup seluruhnya.** Perlu dicatat
supaya tidak dikira selesai: `searchEligibleAttendants` dan
`searchEligibleInstructors` (`db/query/training.ts:499`, `:590`) **tidak
memfilter berdasarkan Struktur sama sekali**. Setelah tiket ini, seorang BPK
yang sah mengelola Daurahnya tetap melihat Kader dari seluruh Struktur
se-Indonesia di hasil pencarian.

Yang berubah pada **dua aksi ini**: dari siapa pun tanpa sesi bisa
mengenumerasi seluruh Kader, menjadi hanya Akun yang berhak atas Daurah itu.
Penyempitan besar, bukan penutupan.

**Dan celah sekelasnya masih ada satu lagi di tempat lain.**
`searchMasterCandidatesAction`
(`trainings/_components/add-training-modal/action.ts:47`) juga tidak membaca
sesi sama sekali, dan memanggil `searchEligibleInstructorsGlobal` — enumerasi
seluruh Instruktur bersertifikat se-Indonesia, tanpa sesi. Ia terlewat dari
survei yang melahirkan tiket ini karena survei itu hanya menelusuri
`training-detail-view`. Ditulis sebagai tiket 04; tidak dikerjakan di sini
karena gate-nya berbeda bentuk — aksi itu tidak punya `trainingId`, sehingga
`assertCanManage` tidak berlaku.

Untuk Instruktur perilaku ini mungkin memang disengaja — ada
`searchEligibleInstructorsGlobal` dengan nama yang menyatakannya, dan Instruktur
dari Struktur lain memang lazim mengajar. Untuk Peserta jauh lebih meragukan:
DM1 di sebuah PK semestinya menjangkau Kader PK itu, bukan nasional.

Ini pertanyaan domain, bukan bug yang jelas — perlu diputuskan lebih dulu apakah
Peserta boleh lintas Struktur. Layak tiket sendiri dan sebaiknya lewat
`/domain-modeling`, karena `CONTEXT.md` belum menyebut apa pun tentang dari mana
Peserta sebuah Daurah boleh berasal.

**Gate mendahului pintasan `query.length < 2`** — bukan sesudahnya. Aksi ini
endpoint POST tersendiri, jadi tidak boleh mengandalkan combobox yang sudah
menyaring di sisi klien.
