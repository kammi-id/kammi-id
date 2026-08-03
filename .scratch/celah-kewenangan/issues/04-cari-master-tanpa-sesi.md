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

- [ ] Aksi menolak ketika tidak ada sesi
- [ ] Aksi menolak Kewenangan di luar `root`/`bpk`
- [ ] Gate mendahului pintasan `query.length < 2`
- [ ] Bentuk balikan `{ data, success, message? }` tidak berubah
- [ ] Ada tes untuk kedua jalur penolakan dan satu jalur berhasil
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
