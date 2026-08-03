# 02 — Cakupan terlewat saat membaca daftar Kader dan Perangkat

**What to build:** Pembacaan daftar Kader di halaman `kader` dan `perangkat`
harus menegakkan Cakupan. Saat ini pengecekannya dilewati, dan Struktur yang
dibaca diambil dari slug URL.

**Blocked by:** None — can start immediately.

**Status:** done

Rantainya:

1. `members-page-content.tsx:73-76` mengambil `currentOrg` dari slug URL —
   Struktur mana pun bisa disebut di situ.
2. `members-page-content.tsx:135` menyusun `mFilters` **tanpa key `user`**.
3. `readDescendantMembers` (`db/query/member.ts:435`) menegakkan Cakupan di
   dalam `if (user) { ... }`. Tanpa `user`, seluruh cabang itu dilewati.
4. `AccessGuard` di `members-page-content.tsx:284` hanya memeriksa Kewenangan
   (`root`/`bph`/`bpk`) — ia tidak pernah menanyakan **Struktur mana**.

Akibatnya sebuah Akun BPK di satu PK dapat membuka `/dashboard/kader/<pk-lain>`
dan melihat daftar Kader Struktur itu. Bentuk yang sama ada di
`perangkat/[[...slug]]/page.tsx:46` lewat `getCachedMemberAggregates`, yang
juga dipanggil tanpa `user`.

**Cakupan sebagai parameter opsional adalah akar masalahnya.** Selama
`readDescendantMembers` bisa dipanggil tanpa Akun, jalur baru akan terus
melewatkannya tanpa ada yang menyadari. Perbaikan sempitnya adalah meneruskan
`user` di kedua pemanggil; perbaikan yang benar adalah membuat Cakupan tidak
mungkin dilewatkan — lihat kandidat 3 di review arsitektur.

Kerjakan perbaikan sempitnya lebih dulu: ini production, dan lubangnya terbuka
sekarang.

- [x] `mFilters` meneruskan `user` ke `getCachedDescendantMembers`
- [x] `getCachedMemberAggregates` di halaman `perangkat` menerima `user`
- [x] Akun BPK tidak bisa membaca Kader Struktur di luar Cakupannya lewat slug
- [x] Root masih bisa membaca seluruh Struktur
- [x] Ada tes yang menembak lewat slug Struktur asing dan mengharapkan kosong
      (`tests/member-scope.test.ts`)
- [x] `bun run check:types` lolos
- [x] Seluruh tes lolos — kecuali dua kegagalan lama di
      `tests/access-control.test.ts` (hook timeout, sudah ada sebelum perubahan
      ini)

## Yang dikerjakan

Perbaikan sempitnya dikerjakan, plus satu langkah kecil ke arah kandidat 3:
`user` sekarang **wajib** pada `readDescendantMembers` dan
`readMemberAggregates` (dan pada kedua pembungkus `getCached*`-nya). Cakupan
tidak lagi bisa dilewatkan tanpa disadari — melewatkannya adalah error
`tsc`, bukan kebocoran senyap. Hanya ada tiga pemanggil, jadi ongkosnya nol.

Ikut diperbaiki: `getCachedMemberAggregates` di dalam
`members-page-content.tsx` juga dipanggil tanpa `user` — lubang yang sama
persis pada kartu ringkasan di halaman yang sama.

Catatan cache: `user` sekarang bagian dari argumen fungsi `'use cache'`, jadi
entri cache terpisah per `{role, connectedOrganizationId}`. Kardinalitasnya
naik, dan memang harus begitu — sebelumnya satu entri per Struktur dipakai
bersama lintas Cakupan.

Belum dikerjakan (di luar cakupan isu ini): `currentOrg` masih diambil dari
slug URL tanpa `isOrgInScope`. Akun BPK yang menembak slug asing sekarang
melihat halaman kosong, bukan penolakan — nama Struktur dan daftar anaknya
masih terbaca. Layak jadi isu tersendiri.
