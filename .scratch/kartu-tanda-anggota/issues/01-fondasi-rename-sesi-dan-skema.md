# 01 — Fondasi: rename Kaderisasi, pemutus sesi, dan pemecahan skema

**What to build:** tiga perubahan mekanis yang dibutuhkan tiket-tiket sesudahnya,
digabung dalam satu PR justru supaya sisanya bisa paralel.

**Blocked by:** None — harus mendarat lebih dulu, sendirian.

**Status:** ready-for-agent

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
- `grep -ri kekaderan src/` kosong; `grep -ri pengkaderan src/` kosong.
- `docs/adr/0001` dan `0009` tidak tersentuh diff.
