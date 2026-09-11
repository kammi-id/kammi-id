# 02 — Empat celah wewenang di halaman profil, ditutup sekaligus

**What to build:** penegakan sisi server atas ADR 0027 — pilih skema dari peran,
gerbang baca untuk semua peran, Cakupan pada BPK, dan kunci NIA.

**Blocked by:** 01

**Status:** done — dikerjakan 2026-09-11, lihat Comments

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

## Comments

**2026-09-11 — selesai, commit `d9c0f91` (digabung `51e0a77` ke `dev-20260104`).**

Keempat celah ditutup persis seperti dirancang: skema dipilih dari peran di
`updateMemberProfileAction`/`updateMemberPhotoAction`, gerbang baca baru
`requireMemberReadAccess` (`src/lib/auth/kaderisasi.ts`) komposisi di atas
`requireKaderisasiAccess`, `requireMemberEditAccess` menutup Celah 3 dengan
Cakupan wajib, dan `updateProfileAction` membuang `name` untuk `role ===
'member'` menutup Celah 4. Ketiga "Sekalian" ikut: `displayName` mengikuti
`member.name` di `updateMember`, ganti password sendiri memutus sesi lain
(`deleteSessionsByUser(userId, session.id)`), reset oleh pengurus memutus
semua sesi.

Review dua-sumbu (`code-review`) menemukan satu pelanggaran nyata:
gerbang baca Celah 2 awalnya ditulis inline di `page.tsx` alih-alih lewat
gerbang bernama di `src/lib/auth/`, melanggar AGENTS.md "Shared authorization
logic ... never duplicated across route-level action files." Diperbaiki
dengan mengekstrak `requireMemberReadAccess` sebelum commit — sekarang baca
dan tulis benar-benar tidak bisa berpisah, gerbang yang sama alasannya dengan
`requireMemberEditAccess`.

Review Spec mencatat satu nuansa (bukan cacat): uji "member mengirim
`status: 'ab3'` → ditolak" pada kenyataannya lolos lewat Zod yang diam-diam
membuang kolom tak dikenal (`success: true`), bukan pesan penolakan eksplisit
— properti keamanannya tetap terjaga (baris tidak berubah, teruji), tapi kata
"ditolak" di tiket tidak menggambarkan persis apa yang terjadi. Diterima
sebagaimana adanya, tidak diubah.

**Temuan sampingan, tidak dikerjakan di sini:** urutan prioritas Keadaan
Kader (`isAlumn` vs `isSuspended` vs `isNonActive`) di `profile-sidebar.tsx`,
`profile-info.tsx`, dan `status-section.tsx` **tidak sama** dengan
`deriveKeadaanKader` baru (tiket 04) maupun dengan `CONTEXT.md` ("Alumni
menggantikan Keadaan sebelumnya"). Ketiganya lebih dulu memeriksa
`isSuspended`, `deriveKeadaanKader` lebih dulu memeriksa `isAlumn`, dan tidak
ada constraint di skema atau basis data yang menjamin ketiga bendera itu
saling meniadakan (`memberManagedSchema` mengizinkan ketiganya `true`
bersamaan). Bukan regresi tiket ini — sudah ada sejak sebelumnya — tapi kini
empat implementasi berbeda hidup berdampingan. Layak jadi tiket konsolidasi
tersendiri: satukan keempatnya di atas `deriveKeadaanKader`.

Gerbang hijau: `check:types`, `check:lint` (0 galat), `check:structure`,
`check:format`. Suite penuh `bun run test` (setelah digabung ke
`dev-20260104` bersama 03/04/06): 1341 lolos, 0 gagal.
