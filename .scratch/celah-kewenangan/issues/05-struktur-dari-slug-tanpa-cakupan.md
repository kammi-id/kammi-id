# 05 — Struktur diambil dari slug URL tanpa memeriksa Cakupan

**What to build:** Halaman yang menerima slug Struktur harus menolak slug di
luar Cakupan Akun, bukan menampilkannya kosong.

**Blocked by:** None — tiket 02 sudah selesai dan tidak memblokir ini.

**Status:** ready-for-agent

Sisa dari tiket 02. Di sana daftar Kader-nya sudah ditutup — tapi hanya
daftarnya.

`members-page-content.tsx:76` dan `perangkat/[[...slug]]/page.tsx:35`
sama-sama memanggil `getCachedOrganization(lastSlug)` lalu memakai hasilnya
apa adanya. `readOrganization` (`db/query/organization.ts:216`) tidak punya
konsep Cakupan sama sekali — tidak ada parameter `user`, tidak ada tempat
untuk menaruhnya. Slug mana pun mengembalikan Struktur mana pun.

Setelah tiket 02, Akun BPK yang membuka `/dashboard/kader/<pk-lain>` melihat
halaman **kosong**, bukan penolakan. Yang masih terbaca:

1. **Nama Struktur asing** — `getMembersPageLabels(currentOrg, ...)` di `:95`
   memasangnya jadi judul halaman dan subjudul.
2. **Daftar Struktur anaknya** — `getCachedOrganizations(orgFilters)` di `:167`
   dengan `parentId: [currentOrg.id]` (`:128`). Ini juga tanpa Cakupan. Hanya
   kena kalau slugnya PP/PW/PD/PDLN, karena `showSummary` (`:104`) mati untuk
   PK.
3. **Keberadaan dan strukturnya** — remah roti di `MembersPageHeader`.

Angkanya sendiri sudah nol: `getCachedMemberAggregates` sekarang ber-Cakupan,
jadi tiap kartu dan tiap baris ringkasan berisi 0. Yang bocor nama, bukan
Kader.

**Jalur tulis sudah aman, jangan ikut diubah.** `BulkUploadDialog` di `:303`
memang menerima `currentOrg.id` yang asing, tapi `bulk-upload/action.ts:89`
menegakkan `isOrgInScope` sebelum menulis. Dialognya tampil, aksinya menolak.

**Yang tepat adalah gate di halaman, bukan di `readOrganization`.** Membuat
`user` wajib di `readOrganization` seperti yang dilakukan pada
`readDescendantMembers` akan menyentuh puluhan pemanggil, banyak di antaranya
`(main)` yang publik dan memang tidak punya sesi — Struktur publik memang
boleh dibaca siapa saja. Yang perlu ber-Cakupan adalah **halaman dashboard
yang menerima slug**, bukan pembacaan Strukturnya. `isOrgInScope`
(`db/query/organization.ts:326`) sudah ada dan sudah dipakai `bulk-upload`;
pakai itu.

Perhatikan `isOrgInScope` mengembalikan `false` untuk setiap Kewenangan selain
`root` dan `bpk` — termasuk `bph`, yang lolos `AccessGuard` di
`members-page-content.tsx:289`. Pakai apa adanya dan halaman itu akan menolak
Akun BPH yang sekarang boleh masuk. Putuskan dulu apakah BPH memang berhak,
lalu sesuaikan salah satunya — jangan tambal dengan pengecualian di
pemanggil.

Slug kosong (`!slug || slug.length === 0`) jatuh ke `connectedOrganization`
Akun sendiri dan tidak perlu diperiksa.

- [ ] Slug Struktur di luar Cakupan ditolak, bukan ditampilkan kosong
- [ ] Penolakannya konsisten di `kader` dan `perangkat`
- [ ] Root masih bisa membuka Struktur mana pun
- [ ] Slug kosong masih jatuh ke Struktur Akun sendiri
- [ ] Nasib Akun BPH diputuskan sadar, bukan sebagai efek samping
      `isOrgInScope`
- [ ] Jalur `bulk-upload` tidak berubah perilakunya
- [ ] Ada tes untuk slug asing, slug sendiri, dan Root
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
