# 02 — Cakupan terlewat saat membaca daftar Kader dan Perangkat

**What to build:** Pembacaan daftar Kader di halaman `kader` dan `perangkat`
harus menegakkan Cakupan. Saat ini pengecekannya dilewati, dan Struktur yang
dibaca diambil dari slug URL.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

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

- [ ] `mFilters` meneruskan `user` ke `getCachedDescendantMembers`
- [ ] `getCachedMemberAggregates` di halaman `perangkat` menerima `user`
- [ ] Akun BPK tidak bisa membaca Kader Struktur di luar Cakupannya lewat slug
- [ ] Root masih bisa membaca seluruh Struktur
- [ ] Ada tes yang menembak lewat slug Struktur asing dan mengharapkan kosong
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
