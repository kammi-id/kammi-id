# 20 — Invarian lapisan baca: saring Terhapus, loloskan Non-Aktif

**Type:** implementation
**Status:** resolved
**Blocked by:** 13

Spec: [`../spec.md`](../spec.md) §7 (seluruhnya), §1.4

## Pekerjaan

**Tiap pembacaan atas tabel yang mereferensi `organization` wajib menyaring Struktur
Terhapus. Struktur Non-Aktif TIDAK disaring.**

**Asimetri itu inti aturannya, dan ia wajib dipertahankan.** Keputusan penelusuran
tiket 27 bergantung padanya: Non-Aktif tetap terlihat dari dalam dasbor beserta
isinya, Terhapus diperlakukan seolah barisnya tidak pernah ada.

Ini **aturan, bukan temuan** — pembaca yang belum lahir mewarisinya tanpa harus
menemukannya ulang.

### Tujuh referensi

| Referensi | Yang dikerjakan |
| --- | --- |
| `organization.parent_id` | Terhapus tidak boleh muncul sebagai anak — di pohon, di dropdown induk, di agregat, di pencarian |
| `member.organization_id` | lihat kasus konkret di bawah |
| `training.organization_id` | hampa oleh prasyarat, **tetap disaring demi keseragaman** |
| `article.organization_id` | pembacanya belum ada — pasang aturannya, bukan permukaannya |
| `article_category.organization_id` | idem |
| `site_settings.organization_id` | idem |
| `user.connected_organization_id` | **JANGAN DISARING** — lihat di bawah |

### `user` dikecualikan, dan itu disengaja

Keadaan Akun sudah dijaga tiket 19 di `readActiveSession`/`validateSession`, bukan
oleh filter baca. Menyaring Terhapus dari pembacaan `user` justru akan
**menyembunyikan baris Akun dari permukaan administratif yang perlu melihatnya**.

Gerbangnya di sesi. **Jangan tambahkan yang kedua di lapisan baca.**

### Kasus konkret: perbaiki yang benar-benar bocor

**`readMemberAggregates` bocor** (`src/db/query/member.ts:145-147`). Ia memancarkan
**satu baris per organisasi di subtree**, dikunci `organizationId`, terlepas dari
berapa Member yang menempel — jadi Struktur Terhapus muncul sebagai **entri
berhitungan nol**. Struktur yang seharusnya tak terlihat, hadir di daftar.

**`readDescendantMembers` TIDAK bocor** (`src/db/query/member.ts:459-463`, `:523`).
Ia menyaring `m.deleted_at IS NULL`, dan prasyarat penghapusan menjamin Struktur
Terhapus punya **nol Member hidup** — jadi ia tidak menghasilkan satu baris pun.

> **Jangan tambal `readDescendantMembers`.** Tambalan di tempat yang salah tidak
> menutup apa pun, dan rumusan lama yang menyebut "kedua CTE menyedot Kader milik
> Struktur Terhapus" sudah dikoreksi — bukan Kader yang tersedot, melainkan barisnya
> sendiri yang muncul.

Keduanya memakai `WITH RECURSIVE org_tree` yang menelusuri `parent_id` **tanpa satu
pun filter Keadaan**. Setelah invarian ini terpasang, `org_tree` menyaring
**Terhapus** dan **tetap meloloskan Non-Aktif** — sebab justru pelolosan itu yang
membuat tiket 27 sah: Kader di bawah sebuah PD Non-Aktif **tetap terbaca dari daftar
Kader PW induknya**, teragregasi ke atas.

### Satu fungsi baca yang sengaja terbalik

Permukaan tiket 28 butuh membaca Struktur Terhapus. Sediakan **tepat satu** fungsi
baca yang sengaja melakukan kebalikan invarian ini, dipakai oleh **tepat satu**
permukaan. Bukan flag di fungsi baca biasa, dan bukan filter berbasis peran — filter
berbasis peran di `/dashboard/branches` melubangi invarian di halaman yang paling
sering dibaca, dan lubang di permukaan tersibuk adalah lubang yang paling mahal.

### Slug Struktur Terhapus → 404

`getCachedOrganization(slug)` (`dashboard/_data/organizations.ts:16`) dan
kawan-kawannya: slug yang menunjuk Struktur Terhapus menghasilkan **404, sama persis
dengan slug yang memang tidak pernah ada**. Tidak ada permukaan yang berkata
"Struktur ini sudah dihapus" — kalimat itu sendiri membocorkan bahwa ia ada.

## Selesai bila

- Ketujuh referensi tunduk (dengan `user` sebagai pengecualian yang **terdokumentasi
  di kode**, bukan terlupa)
- `readMemberAggregates` tidak lagi memancarkan baris untuk Struktur Terhapus
- `readDescendantMembers` **tidak** disentuh
- Non-Aktif masih lolos di kedua CTE — buktikan, jangan asumsikan
- Slug Struktur Terhapus → 404

## Answer

**Invariannya dipasang di `withOrganizationCTE`, bukan di tiap pembaca.** Itu
satu-satunya bentuk yang memenuhi "aturan, bukan temuan": pembaca yang belum
lahir mewarisinya dengan cara membaca lewat CTE itu, tanpa harus menemukannya
ulang. `readOrganization`, `countOrganization`, `createOrganization`, dan
`withMemberCTE` semuanya tunduk tanpa satu baris tambahan.

Separuh lagi ada di tipe: **`OrganizationFilters.state` sekarang
`VisibleOrganizationState[]`** (`Exclude<OrganizationState, 'terhapus'>`), jadi
`readOrganization({ state: ['terhapus'] })` galat `tsc` alih-alih jadi jalan
memutar. Invariannya tidak bersandar pada tidak-ada-yang-terpikir.

### Pengecualian `user` ditulis sebagai kode, bukan sebagai catatan

`withUserCTE` **berhenti memakai `withOrganizationCTE`** dan join ke tabel
`organization` langsung. Sebelumnya ia lewat CTE itu, jadi kalau dibiarkan, ia
akan ikut tersaring diam-diam dan `connectedOrganization` jadi null di permukaan
administratif yang justru dibuat untuk melihatnya. Pengecualiannya sekarang
berupa perbedaan yang kelihatan di berkas, dengan alasannya di atasnya.

### Cakupan yang menutup lapisan Kader, bukan tambalan

`fetchAllowedOrgIdsFor` mengeluarkan Terhapus di **ketiga** cabangnya (root,
pembacaan Struktur si Akun, dan penelusuran rekursif di kedua kaki). Ini yang
membuat **`readDescendantMembers` benar-benar tidak perlu disentuh**: ia
meng-interseksi `org_tree`-nya dengan `allowedIds`, jadi subtree Terhapus jatuh
dari kedua kuerinya (data dan count) tanpa satu tambalan pun di dalamnya.

Ketegangan di §7.1 ("kedua CTE menyaring Terhapus") lawan Selesai-bila
("`readDescendantMembers` tidak disentuh") **selesai tanpa harus memilih**:
invariannya sampai ke sana lewat Cakupan. Selesai-bila yang diikuti, dan §7.1
tetap benar hasilnya.

`readMemberAggregates` — yang memang bocor — disaring di kedua kaki `org_tree`.
`readMemberDistributionByOrgType` ikut, dengan bentuk yang sama.

### Satu fragmen untuk tabel yang cuma menunjuk

`organizationNotDeleted(kolomIdOrganisasi)` — sebuah `EXISTS` yang dipakai
`training`, `article`, `article_category`, dan `site_settings`. Empat tabel itu
tidak pernah nge-join `organization`, jadi CTE-nya tidak menjangkau mereka;
fragmen ini membuat keempatnya menyatakan aturan yang sama persis alih-alih
mengarang `EXISTS` masing-masing. Ia jalan di `where` Drizzle maupun di template
`sql` mentah.

### Satu pembalik, satu fungsi

`readDeletedOrganizations` — Terhapus dan tidak ada yang lain, fungsi tersendiri,
untuk satu permukaan (tiket 28). Bukan flag di `readOrganization`, bukan filter
berbasis peran di `/dashboard/branches`. Ia membawa `parentId` karena urutan
pemulihan ditentukan induk lama.

**Ia sengaja tidak menerima `AccessScope`, dan alasannya ditulis di kode.**
Aturan AGENTS.md ("Cakupan wajib, tidak pernah opsional") mengatur pembacaan
**ber-Cakupan**, dan ini tidak bisa jadi salah satunya: baris Terhapus ada di
luar tiap Cakupan menurut konstruksinya, jadi tidak ada yang bisa dipersempit
sebuah scope. `requireStrukturRestoreAccess` tidak menerima sasaran karena
alasan yang sama, dan dua peran yang memegang `pulihkan` (Root dan BPW PP)
sama-sama menjangkau seluruh negeri. Pasangannya jadi lebih lemah daripada
parameter wajib — dan itu **dinyatakan di docblock-nya**, bukan dibiarkan
ditemukan.

### Bug yang ketahuan gara-gara tesnya, dan sudah lama ada

**`childrenCount` selalu bernilai 0, untuk tiap Struktur, sejak sebelum peta
ini.** `${withOrganizationCTE.id}` ter-render jadi `"id"` telanjang di dalam
template `sql` mentah — hanya `.where()` yang mengkualifikasinya — dan `"id"`
telanjang mengikat ke lingkup subkuerinya sendiri. Predikatnya jadi
`parent_id = id`, yang benar untuk nol baris.

Ia diperbaiki di sini (tabel dalamnya di-alias, kedua sisi dikualifikasi lewat
`${withOrganizationCTE}` yang ter-render jadi nama CTE-nya) karena tanpa itu
referensi `organization.parent_id` tidak bisa dibuktikan sama sekali, dan karena
prasyarat penghapusan tiket 22 akan membacanya sebagai "semua Struktur nol
anak". **Efek yang terlihat pengguna:** lencana jumlah anak di
`branch-card.tsx:82` dan `member-branch-card.tsx:185` selama ini tidak pernah
muncul; sekarang muncul dengan angka sebenarnya.

### Slug Terhapus

Ia jatuh dari `readOrganization`, jadi `getCachedOrganization(slug)`
mengembalikan `undefined` — **jawaban yang sama persis dengan slug yang tidak
pernah ada**, yang memang syaratnya. Permukaannya sendiri tidak diubah: tiga
halaman merender "Wilayah tidak ditemukan." dan satu memanggil `notFound()`,
dan keduanya perilaku pra-ada yang berlaku identik untuk kedua kasus. Tidak ada
permukaan yang berkata "sudah dihapus".

### Yang sengaja tidak dikerjakan

**Tiga subkueri leluhur di `readDescendantMembers`** (`orgHierarchy`: pk/pd/pw)
masih menelusuri `parent_id` tanpa filter, jadi secara teori ia bisa menyebut
nama induk Terhapus. Dua alasan tidak menyentuhnya: Selesai-bila melarangnya
terang-terangan, dan kebocorannya tidak terjangkau oleh argumen prasyarat yang
tiket ini sendiri pakai — sebuah PD yang punya PK hidup tidak bisa dihapus, dan
PK yang sudah dihapus lebih dulu punya nol Kader hidup. Pola yang sama **sudah**
disaring di `readOrgHierarchyChain` dan `pwNameSubquery`, yang tidak kena
larangan itu. Kalau tiket 27 atau 29 mau menutupnya, tambalannya satu baris per
subkueri.

### Sedikit di luar "lapisan baca", dan disengaja

`generateRegisterNumber` dan jalur `bulk-upload` sekarang membaca Struktur
Terhapus sebagai tidak ada, jadi penomoran NIA ke dalamnya gagal seperti
penomoran ke id yang tidak pernah diterbitkan. `(main)/_data/network.ts` ikut
karena "di mana pun" yang paling terbuka adalah yang publik.

### Tes

`tests/organization-read-invariant.test.ts`, 18 kasus. Pohonnya sengaja
menaruh satu PD Terhapus **dan** satu PD Non-Aktif di bawah induk yang sama,
supaya tiap pembacaan punya dua jawaban benar yang berbeda untuk dibedakan —
pembaca yang menyaring keduanya sekaligus gagal di sini alih-alih lolos.
Pelolosan Non-Aktif dibuktikan di kedua CTE, bukan diasumsikan.

Satu kasus di `tests/organization-state.test.ts` diluruskan: ia dulu menegaskan
`readOrganization({ state: ['terhapus'] })` mengembalikan satu baris. Itu
sekarang galat tipe; niat aslinya (menyaring lewat kolom turunan, bukan menyusun
ulang derivasinya) tetap utuh lewat `non_aktif`.

`bun test`: 420 lolos, 0 gagal. `check:types`, `check:lint`, `check:structure`
bersih.

## Comments

**8 Agustus 2026 — hutang "Yang sengaja tidak dikerjakan" ditutup.**

Ketiga subkueri leluhur `orgHierarchy` di `readDescendantMembers` sekarang
menyaring Terhapus di kedua kaki, persis pola `pwNameSubquery` dan
`readOrgHierarchyChain`. Rantainya **berhenti** di leluhur Terhapus alih-alih
melompatinya — melompat akan menyatakan garis keturunan yang tidak ada (§1.4).

Alasan menutupnya sekarang, padahal tiket ini menyatakan kebocorannya tidak
terjangkau: argumen "tidak terjangkau" itu **bersandar pada prasyarat
penghapusan**, dan pembaca yang jujur hanya kalau tabel lain berperilaku benar
bukan pembaca yang jujur. Argumennya sendiri tetap berdiri — PD dengan PK hidup
tidak bisa dihapus, ticket 23 menolak induk tujuan Terhapus, tiket 12 menolak
pemulihan di bawah induk Terhapus — jadi ini pengerasan, bukan perbaikan bug.

Yang ikut terlihat saat memeriksanya: untuk Root, `fetchAllowedOrgIds`
mengembalikan **seluruh** Struktur tidak-terhapus secara datar, bukan hasil
penelusuran. Jadi PK hidup di bawah PD Terhapus **akan** lolos `allowedIds` dan
`org_tree` yang memang sengaja tidak disaring. Kebocorannya ditahan oleh
prasyarat saja, bukan oleh Cakupan seperti yang tertulis di docblock aslinya —
kalimat itu sudah diluruskan di tempat.

Tesnya satu kasus baru di `tests/organization-read-invariant.test.ts` dengan
subtree sendiri, sebab menumpang `pw` akan mengubah dua hitungan yang diuji di
atasnya. `bun test`: 510 lolos, 0 gagal, dua run penuh berturut-turut.
