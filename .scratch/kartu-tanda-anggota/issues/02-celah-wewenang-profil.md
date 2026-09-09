# 02 — Empat celah wewenang di halaman profil, ditutup sekaligus

**What to build:** penegakan sisi server atas ADR 0027 — pilih skema dari peran,
gerbang baca untuk semua peran, Cakupan pada BPK, dan kunci NIA.

**Blocked by:** 01

**Status:** ready-for-agent

> **Ini bukan fitur. Ini empat cacat yang sedang tayang di production**, dan
> yang pertama membiarkan Kader mana pun menaikkan jenjangnya sendiri.
> Dahulukan tiket ini di atas kartunya.

## Celah 1 — Kader menyunting kolom yang bukan haknya

`updateMemberProfileAction` mem-parse seluruh `profileSchema` untuk pemanggil
mana pun. `profile-sidebar.tsx` merender kontrol `status` (AB1/AB2/AB3),
`isSuspended`, `isAlumn`, `isNonActive`, `isCertifiedMentor`,
`isCertifiedInstructor` setiap kali `isEditing`, dan `isEditing` dinyalakan oleh
`canEdit` — benar bagi Kader atas profilnya sendiri.

**Perbaikan:** aksi memilih skema dari peran, bukan dari isi FormData.

```ts
const schema = role === 'member' ? memberSelfEditSchema : memberManagedSchema
```

Menyembunyikan kontrolnya di `profile-sidebar` **juga** dikerjakan, tapi sebagai
akibat, bukan sebagai penegakan. Sebuah POST rakitan tangan harus gagal di
skema.

`updateMemberPhotoAction` di berkas yang sama memakai `canEditMember` yang sama
dan ikut kena perbaikan Cakupan di bawah.

## Celah 2 — halaman profil tidak punya gerbang baca

`/dashboard/profile/[registerNumber]/page.tsx` memanggil
`getCachedMemberByRegisterNumber` lalu merender. Tidak ada gerbang. Setiap sesi
bisa mengetikkan NIA mana pun dan menerima telepon, alamat lengkap, tanggal
lahir, riwayat akademik, karier, dan Mutasi. NIA berurutan di dalam satu Daerah
(ADR 0020), jadi seluruh daftar nasional dapat ditelusuri dengan skrip.

**Perbaikan:** selesaikan Member lebih dulu, lalu

- `role === 'member'` → hanya bila `connectedMember.id === member.id`, selain itu
  `notFound()`;
- selain itu → `requireKaderisasiAccess(member.organizationId)` (nama dari tiket
  01). Root lolos semua, BPH/BPK lolos di dalam Cakupan, BPW dan Humas
  `notFound()`.

`notFound()`, bukan pesan penolakan: membedakan "tidak berhak" dari "tidak ada"
mengubah halaman ini menjadi alat pemeriksa keberadaan NIA.

## Celah 3 — BPK tanpa Cakupan di jalur sunting

`canEditMember` mengembalikan `true` untuk **setiap** `bpk` atas **setiap**
`memberId`. Jalur hapus memeriksa Cakupan (`isOrgInScope`), jalur reset password
memeriksa Cakupan, jalur sunting tidak pernah. BPK PK di Aceh dapat menyunting
Kader di Papua.

**Perbaikan:** komposisikan gerbang yang sama dengan celah 2, supaya baca dan
tulis tidak bisa berpisah. `AGENTS.md`: Cakupan argumen wajib, tidak pernah
opsional.

## Celah 4 — NIA bisa diganti sendiri

`updateProfileAction` (`dashboard/user/account/_components/action/action.ts`)
menulis `user.name`. Bagi Akun Kader, `user.name` **adalah** NIA-nya —
identitas permanen yang tidak pernah terbit ulang (ADR 0020) sekaligus identitas
login.

**Perbaikan:** buang `name` dari nilai yang ditulis bila `role === 'member'`,
dan sembunyikan medannya di `account-form`. Akun Kepengurusan tetap boleh
mengganti `user.name`-nya.

## Sekalian, dari keputusan sesi yang sama

- **`user.displayName` mengikuti `member.name`.** Menulis `member.name` ikut
  menulis `displayName` pada Akun yang terhubung, sebab `createMember`
  menyemainya dari sana dan tanpa ini ia basi selamanya di sidebar.
- **Ganti password sendiri memutus sesi lain.** `updatePasswordAction` memanggil
  `deleteSessionsByUser(userId, currentSessionId)` — semua kecuali yang sedang
  dipakai.
- **Reset password oleh pengurus memutus semua sesi.**
  `regenerateCredentialAction` memanggil `deleteSessionsByUser(userId)` tanpa
  pengecualian. Tanpa ini, "reset password Kader ini" tidak berarti apa yang
  dikira penekannya: cookie lama sah sampai tiga hari.

## Uji

Yang wajib ada, karena inilah klaim yang layak dijaga:

- seorang `member` mengirim `status: 'ab3'` untuk dirinya sendiri → ditolak,
  dan barisnya **tidak berubah**;
- seorang `member` mengirim `isSuspended: false` saat ia sedang kena Sanksi →
  ditolak;
- seorang `member` membuka NIA milik orang lain → `notFound()`;
- BPK PK membuka dan menyunting Kader di luar Cakupan → `notFound()` / ditolak;
- seorang `member` mengganti `user.name` → NIA tidak berubah.
