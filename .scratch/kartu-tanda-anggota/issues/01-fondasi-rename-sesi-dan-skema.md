# 01 — Fondasi: rename Kaderisasi, pemutus sesi, dan pemecahan skema

**What to build:** tiga perubahan mekanis yang dibutuhkan tiket-tiket sesudahnya,
digabung dalam satu PR justru supaya sisanya bisa paralel.

**Blocked by:** None — harus mendarat lebih dulu, sendirian.

**Status:** done — dikerjakan 2026-09-09, lihat Comments

## Mengapa satu tiket, dan mengapa duluan

Ketiganya bukan satu fitur. Mereka digabung karena ketiganya menyentuh berkas
yang dibutuhkan banyak tiket lain, dan karena salah satunya **memindahkan
berkas**. Sebuah PR yang mengganti nama `kekaderan.ts` menjadi `kaderisasi.ts`
sementara PR lain menyunting isinya menghasilkan konflik yang git tidak bisa
bantu selesaikan. Satu langkah serial di depan menukar satu jam menjadi empat
tiket yang benar-benar paralel.

## Bagian A — `Kekaderan` → `Kaderisasi`

Sudah diputuskan di `CONTEXT.md` (lihat entri **Kaderisasi**). Yang berpindah:

- `src/lib/auth/kekaderan.ts` → `src/lib/auth/kaderisasi.ts`, beserta
  `kekaderan.test.ts` → `kaderisasi.test.ts`.
- `requireKekaderanAccess` → `requireKaderisasiAccess`. Dua saudaranya di berkas
  itu (`requireMemberMutationAccess`, `requireMemberTrashAccess`) tidak berubah.
- `kekaderanRoles` → `kaderisasiRoles`, dan komentar yang menyebut "Kekaderan".
- Label UI **"Perangkat Pengkaderan"** → **"Perangkat"**. Bukan "Perangkat
  Kaderisasi": glosarium mendefinisikan **Perangkat** tanpa pengualifikasi, dan
  menambahkan satu hanya memindahkan kata yang sedang dibuang.
- "Status Kaderisasi" di `profile-sidebar.tsx` sudah benar; biarkan.

**Jangan sentuh `docs/adr/`.** ADR 0001 dan 0009 memakai "Kekaderan" dan tetap
begitu — ADR adalah catatan bertanggal, dan menyuntingnya membuat catatan itu
berbohong. Presedennya "Berita Jaringan" di ADR 0012 & 0013.

Cakupan: 17 berkas menyebut Kekaderan, 13 menyebut Pengkaderan.

## Bagian B — `deleteSessionsByUser`

`src/db/query/session.ts` punya `deleteSession(id[])` tapi tidak punya cara
memutus seluruh sesi seorang pengguna. Tabel `session` sudah berkolom `user_id`
dengan `onDelete: 'cascade'` ke `user`, jadi ini satu `DELETE ... WHERE user_id`.

```ts
export const deleteSessionsByUser = async (
  userId: string,
  exceptSessionId?: string
): Promise<void> => { ... }
```

`exceptSessionId` ada untuk satu pemanggil saja — Kader yang mengganti password
sendiri dan tidak boleh menendang dirinya keluar di tengah aksinya (tiket 02).
Reset oleh pengurus memanggilnya tanpa argumen kedua.

Butuh indeks pada `session.user_id` bila belum ada — periksa
`src/db/__migrations`. Ini migrasi; **jangan jalankan tanpa konfirmasi.**

## Bagian C — pemecahan `profileSchema`

Sesuai ADR 0027. `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/action/schema.ts`
menjadi dua ekspor:

- `memberSelfEditSchema` — `name`, `gender`, `phone`, `photo`, `birthPlace`,
  `birthDate`, seluruh kolom `address*`.
- `memberManagedSchema` — `memberSelfEditSchema` ditambah `status`,
  `yearOfEntry`, `isAlumn`, `isSuspended`, `isNonActive`, `isCertifiedMentor`,
  `isCertifiedInstructor`, dan `.superRefine(refineAb1Certification)`.

Ekspor `profileSchema` **dihapus**, bukan dipertahankan sebagai alias:
pemanggil yang tertinggal harus menjadi galat `tsc`, bukan diam-diam memakai
skema penuh. Tiket ini hanya memindahkan definisinya; yang memilih skema mana
adalah tiket 02.

`schema.test.ts` yang ada ikut dipecah.

## Selesai bila

- `bun run check:types`, `check:lint`, `check:structure` hijau.
- `grep -ri kekaderan src/` kosong.
- `grep -ri pengkaderan src/` kosong **kecuali dua pengecualian di bawah**.
- `docs/adr/0001` dan `0009` tidak tersentuh diff.

### Dua "Pengkaderan" yang sengaja tinggal

Keduanya ditemukan saat pelaksanaan; kriteria mutlak di atas ditulis sebelum
keduanya terlihat, jadi yang diamandemen kriterianya, bukan kodenya.

1. **`bulk-upload-utils.ts` — judul kolom XLSX warisan.** `'Jenjang
   Pengkaderan'` adalah judul kolom pada templat yang sudah diunduh pengguna.
   Templat baru menerbitkan `'Jenjang Kaderisasi'`, tetapi pembacanya tetap
   menerima yang lama: tanpa itu setiap berkas lama kehilangan kolom status dan
   jatuh diam-diam ke `'ab1'` — menurunkan jenjang **setiap baris** yang
   diimpor, di sistem yang sudah tayang. Ini data, bukan prosa.

2. **`karakteristik-section.tsx` — salinan doktrinal situs publik.**
   "Harokatu Tajnid — Organisasi Pengkaderan" adalah gloss resmi KAMMI atas
   istilah Arabnya, bukan penamaan internal. Glosarium `CONTEXT.md` mengatur
   bagaimana tim menamai sesuatu di antara mereka sendiri; ia tidak mengarang
   ulang bagaimana organisasi memperkenalkan dirinya kepada pengunjung.
   Diputuskan pengambil keputusan saat pelaksanaan.

## Comments

**2026-09-09 — selesai, commit `d074fa8` di `dev-20260104`.**

Ketiga bagian mendarat. Gerbang hijau: `check:types`, `check:lint` (0 galat),
`check:structure`, `check:format`. Suite penuh `bun run test`: 1273 lolos, 0
gagal.

Bagian A juga memindahkan `src/lib/kekaderan/` → `src/lib/kaderisasi/`, yang
tidak disebut badan tiket tapi diwajibkan kriteria `grep`-nya. Dua
"Pengkaderan" sengaja tinggal; alasannya dicatat di **Selesai bila** di atas.

Bagian C memindahkan definisinya saja, sesuai tiket. `updateMemberProfileAction`
**masih memakai `memberManagedSchema`** — yaitu skema penuh, perilaku lama
persis. Artinya celah ADR 0027 masih terbuka di production sampai **tiket 02**
menyambungkan peran ke skema. `memberSelfEditSchema` hari ini nol pemanggil.

**Belum dijalankan:** migrasi indeks `session.user_id`
(`src/db/__migrations/20260909101826_clumsy_gamora/`, satu `CREATE INDEX`).
Menunggu konfirmasi. Ia soal performa, bukan kebenaran — tiket 06 memakai
`deleteSessionsByUser` dan jalan tanpa indeks itu, cuma dengan seq scan.
Catatan review: tanpa `CONCURRENTLY` ia mengunci `session` (ACCESS EXCLUSIVE)
selama pembangunan, dan `CONCURRENTLY` tidak bisa dipakai karena drizzle
membungkus migrasi dalam transaksi.

**Tindak lanjut yang ditemukan, tidak dikerjakan di sini:** identifier
`Specialist` masih hidup (`SpecialistsWrapper`, `SpecialistSummaryCards`,
folder `kader/_components/specialist-summary-cards/`), melanggar _Avoid_:
Specialist di `CONTEXT.md`. Sengaja ditunda: itu pemindahan folder komponen,
dan 02-06 jalan paralel setelah tiket ini — persis kelas konflik yang tiket 01
diserialkan untuk mencegahnya. Rumahnya `.scratch/domain-model-followups/`.
