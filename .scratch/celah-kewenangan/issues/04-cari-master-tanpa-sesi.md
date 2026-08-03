# 04 — `searchMasterCandidatesAction` berjalan tanpa sesi

**What to build:** `searchMasterCandidatesAction` harus membaca sesi dan
menegakkan Kewenangan sebelum mencari.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Aksinya ada di `trainings/_components/add-training-modal/action.ts:47`:

```ts
export const searchMasterCandidatesAction = async (query: string) => {
  if (query.length < 2) return { data: [], success: true }
  try {
    const data = await searchEligibleInstructorsGlobal(query)
    ...
```

Tidak ada `readActiveSession`, tidak ada pengecekan apa pun.
`searchEligibleInstructorsGlobal` (`db/query/training.ts:560`) mengembalikan
setiap Kader ber-Jenjang AB3 dan bersertifikat Instruktur **se-Indonesia**,
lengkap dengan Nomor Induk Anggota dan Struktur asalnya.

Server Action adalah endpoint POST. Siapa pun yang tahu id aksinya bisa
memanggilnya langsung tanpa pernah melihat UI.

**Ini kelas yang sama dengan tiket 01, tapi gate-nya berbeda bentuk.** Aksi ini
tidak menerima `trainingId`, jadi `assertCanManage` tidak berlaku — tidak ada
Daurah untuk dijadikan sandaran Cakupan. Yang tepat adalah pengecekan
Kewenangan: aksi ini hanya dipakai saat membuat Daurah, dan
`createTrainingAction` di file yang sama sudah membatasi diri pada
`mutationRoles = ['root', 'bpk']` (`:73`). Gate pencarian sebaiknya sama.

**Pencariannya memang nasional dan itu kemungkinan disengaja.** Namanya sendiri
menyatakan `Global`, dan Instruktur dari Struktur lain lazim mengajar. Tiket ini
bukan tentang mempersempit hasilnya menjadi se-Cakupan — hanya tentang
memastikan yang bertanya adalah Akun yang berhak.

Pemanggilnya `add-training-modal.tsx`; ia hanya membaca `success` dan `data`,
jadi menambahkan `message` pada jalur penolakan aman.

- [x] Aksi menolak ketika tidak ada sesi
- [x] Aksi menolak Kewenangan di luar `root`/`bpk`
- [x] Gate mendahului pintasan `query.length < 2`
- [x] Bentuk balikan `{ data, success, message? }` tidak berubah
- [x] Ada tes untuk kedua jalur penolakan dan satu jalur berhasil
- [x] `bun run check:types` lolos
- [x] Seluruh tes lolos

## Comments

**Gate-nya tidak ditulis di dalam `action.ts`.** Kalau ditaruh di situ, ejaan
Kewenangan yang sama akan muncul dua kali dalam satu berkas —
`searchMasterCandidatesAction` dan `createTrainingAction` menjaga hak yang
persis sama. `AGENTS.md` menempatkan logika Kewenangan bersama di
`src/lib/auth/`, jadi lahirlah `requireDaurahCreationAccess`
(`src/lib/auth/daurah.ts`), dinamai menurut hak yang diberikannya, mengikuti
`requireSiteSettingsAccess`. Berkasnya bernama `daurah.ts`, bukan `training.ts`:
`CONTEXT.md` menandai "Training" sebagai istilah yang dihindari, dan
`src/lib/daurah/masa-penetapan-kelulusan.ts` sudah mendahului.

**Bentuk balikannya `{ allowed, message }`, bukan `user | null`.**
`createTrainingAction` sebelumnya membedakan "Sesi tidak ditemukan." dari
"Antum tidak memiliki hak akses untuk menambah daurah.". Gate yang hanya
mengembalikan `null` akan melebur keduanya menjadi satu pesan — jadi pesannya
ikut dibawa gate, dan kedua pemanggil menolak dengan kata yang sama tanpa ada
pesan yang hilang. Pemeriksaan `'Pengguna tidak ditemukan.'` yang lama ikut
larut ke dalam `!session?.user`; ia tidak pernah punya jalur tersendiri yang
bisa dicapai.

**`createTrainingAction` ikut dialihkan ke gate itu**, di luar bunyi harfiah
tiket. Menyisakannya dengan `mutationRoles` inline berarti mempertahankan
duplikat yang justru jadi alasan gate ini dibuat. Karena jalur Kewenangannya
ikut berubah, aksi itu kebagian tiga tesnya sendiri — sebelumnya nol.

**Gate dipasang di dalam `try`, bukan mendahuluinya.**
`requireDaurahCreationAccess` → `readActiveSession` → `validateSession`
menyentuh basis data. Kalau dibiarkan di luar `try`, kegagalan baca sesi
berubah dari `{ data: [], success: false }` menjadi Promise yang menolak —
dan `training-form.tsx:91` memanggilnya di dalam `setTimeout` dengan
`try/finally` tanpa `catch`, jadi penolakannya lolos jadi unhandled rejection.
Urutannya tetap: gate dulu, baru pintasan `query.length < 2`.

**Cakupan sengaja tidak disempitkan.** `searchEligibleInstructorsGlobal` tetap
nasional, sesuai catatan tiket: yang dijaga adalah siapa yang bertanya, bukan
seluas apa jawabannya. Bahwa baca ini tidak menerima `AccessScope` padahal
`AGENTS.md` menulis Cakupan sebagai argumen wajib adalah pengecualian yang
disengaja dan sebaiknya diangkat ke `docs/adr/` — belum dikerjakan di sini.

Tes `tests/access-control.test.ts` merah (hook timeout dan deadlock, jumlahnya
berayun 3–5 antar-jalan) — dipastikan sudah merah sebelum perubahan ini:
berkas itu dijalankan sendirian pada pohon yang di-`git stash -u`, hasilnya
identik.
