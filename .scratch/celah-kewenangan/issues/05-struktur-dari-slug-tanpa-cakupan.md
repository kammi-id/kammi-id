# 05 — Struktur diambil dari slug URL tanpa memeriksa Cakupan

**What to build:** Halaman yang menerima slug Struktur harus menolak slug di
luar Cakupan Akun, bukan menampilkannya kosong.

**Blocked by:** None — tiket 02 sudah selesai dan tidak memblokir ini.

**Status:** done — 78bd068

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

- [x] Slug Struktur di luar Cakupan ditolak, bukan ditampilkan kosong
- [x] Penolakannya konsisten di `kader` dan `perangkat`
- [x] Root masih bisa membuka Struktur mana pun
- [x] Slug kosong masih jatuh ke Struktur Akun sendiri
- [x] Nasib Akun BPH diputuskan sadar, bukan sebagai efek samping
      `isOrgInScope`
- [x] Jalur `bulk-upload` tidak berubah perilakunya
- [x] Ada tes untuk slug asing, slug sendiri, dan Root
- [x] `bun run check:types` lolos
- [x] Seluruh tes lolos

## Comments

**BPH berhak, dan itu bukan keputusan sulit.** `CONTEXT.md:89` menulis
Kewenangan BPH sebagai "memantau — melihat data kekaderan maupun kestrukturan,
tanpa boleh mengubahnya". Kode sudah sejalan di mana-mana kecuali satu tempat:
`readMemberAggregates` dan `readDescendantMembers` (`db/query/member.ts:87`,
`:265`) memasukkan `bph` ke daftar peran, dan `AccessGuard` halaman Kader
sudah mengizinkannya. Yang menyendiri justru `isOrgInScope` — dan alasannya
masuk akal: ia menjaga **jalur tulis** `bulk-upload`, jadi wajar mensyaratkan
BPK. Ia salah dipakai untuk baca, bukan salah ditulis.

Maka `isOrgInScope` tidak disentuh sama sekali — `bulk-upload` berperilaku
persis seperti sebelumnya. Yang ditambahkan adalah `isOrgInAccessScope`
(`db/query/organization.ts`), predikat Cakupan murni: apakah Struktur ini
terjangkau, tanpa ikut bertanya boleh berbuat apa di sana. Pemisahan ini
persis yang diminta review arsitektur kandidat #3 — `isOrgInScope` "mencampur
Cakupan dengan peran harus BPK".

**Gate-nya `requireKekaderanAccess`** (`src/lib/auth/kekaderan.ts`), dinamai
menurut hak yang diberikan: membaca data Kekaderan untuk satu Struktur. Ia
menjawab **jangkauan saja** — peran mana yang boleh masuk ke sebuah halaman
tetap urusan `AccessGuard` halaman itu.

**Gate hanya jalan kalau slugnya ada**, persis seperti bunyi tiket. Versi
pertama menjalankannya tanpa syarat, dan itu diam-diam mengubah nasib Akun
BPW/Humas yang membuka `/dashboard/kader` tanpa slug: dari halaman "tidak
berhak" milik `AccessGuard` jadi 404. Itu lalu lintas di luar kebocoran yang
tiket ini bicarakan, jadi dikembalikan.

**Satu pencarian Cakupan per request, bukan tiga.** Gate memanggil
`fetchAllowedOrgIds`, dan `members-page-content` memanggilnya lagi untuk
menyaring daftar Struktur di form — sementara halaman Perangkat me-render
`MembersPageContent` dua kali (satu per tab). Versi pertama karena itu
menambah CTE rekursif yang justru dihapus commit `955e49e`. Sekarang badan
fungsinya dibungkus `cache()` React dan di-key pada primitif (`role`,
`connectedOrgId`) — kalau di-key pada objek, tiap pemanggil membuat literal
baru dan cache tidak pernah kena. Di luar konteks request React `cache()`
tidak memoize sama sekali, jadi tes tidak melihat nilai basi (sudah diperiksa).

**Penolakannya `notFound()`, bukan pesan "tidak berhak".** Yang bocor di tiket
ini adalah nama dan keberadaan Struktur; halaman 403 justru mengonfirmasi
keberadaannya. `forbidden()` juga belum tersedia — `authInterrupts` tidak
menyala di `next.config`.

**Kebocoran daftar Struktur anak (poin 2) ikut tertutup** tanpa perubahan
terpisah: `getCachedOrganizations({ parentId: [currentOrg.id] })` tidak pernah
terjangkau lagi kalau `currentOrg` di luar Cakupan.

**Satu ketidakkonsistenan sengaja dibiarkan.** `AccessGuard` halaman Kader
mengizinkan `['root','bph','bpk']`, halaman Perangkat hanya `['root','bpk']`.
Itu perbedaan **daftar peran**, bukan Cakupan, dan sudah ada sebelum tiket ini.
Penolakan Cakupan-nya sendiri sekarang identik di kedua halaman. Apakah BPH
boleh memantau Perangkat adalah pertanyaan tersendiri — layak tiket, jangan
diselundupkan lewat sini.

**Tesnya di seam gate, bukan di render RSC.** Repo ini belum punya satu pun
tes yang me-render halaman; 12 tes di `kekaderan.test.ts` mengunci matriks
peran × Cakupan (root, bpk sendiri/turunan/asing/atas, bph di dalam/luar, bpw,
humas, tanpa sesi, tanpa Struktur terhubung) — semuanya lewat id Struktur,
bukan lewat slug. Bahwa gate benar-benar duduk **sebelum**
`getMembersPageLabels` dan remah roti tidak terkunci tes; itu diverifikasi
dengan membaca, `tsc`, dan `bun run build` (kedua route tetap terbangun sebagai
PPR). Kalau nanti repo ini punya tes render, itu lubang tes pertama yang layak
ditutup.

Daftar peran ditulis `satisfies UserRole[]` supaya salah ketik jadi galat
`tsc`, bukan penolakan diam-diam; dibuktikan dengan mengubah `bph` jadi `bhp`
— `tsc` merah di baris itu.

Seed pohon Struktur di tes pindah ke `beforeAll` karena tesnya hanya membaca.
Menyemai per tes membuat berkas ini ikut antre TRUNCATE dan sempat kena hook
timeout yang sama seperti `tests/access-control.test.ts`; setelah dipindah,
48 detik jadi 5 detik dan hijau tiga kali berturut-turut.

Satu duplikasi sengaja dibiarkan: badan `isOrgInScope` sekarang mirip
`isOrgInAccessScope` ditambah syarat BPK. Menyatukannya berarti menyentuh gate
jalur tulis `bulk-upload`, dan tiket ini justru meminta jalur itu tidak
berubah. Layak dirapikan bersama kandidat #3 review arsitektur, bukan di sini.
