# 03 — Kader yang didaftarkan satu per satu tidak pernah bisa masuk

**What to build:** `createMember` mengembalikan plaintext kredensialnya, dan
`add-form` menampilkannya lewat panel yang sudah dipakai `bulk-upload`.

**Blocked by:** 01

**Status:** done — dikerjakan 2026-09-10, lihat Comments

## Lubangnya

`createMember` (`src/db/query/member.ts:310`) membangkitkan password, menyimpan
hash-nya lewat `createUser`, lalu **membuang plaintext-nya**. Ia tidak
dikembalikan dan tidak disimpan di mana pun. Setiap Kader yang didaftarkan lewat
`add-form` karena itu punya Akun yang tidak pernah bisa ia masuki — dan sistem
ini tidak punya kanal surel untuk mengabarkannya (ADR 0028).

`bulk-upload` tidak kena karena ia **melewati `createMember` sepenuhnya**:
ia memanggil `createUser` sendiri dengan password yang ia bangkitkan sendiri,
lalu menampilkannya (`bulk-upload/action.ts:133-148`). Jadi dua jalur pembuatan
Kader berbeda perilakunya karena salah satunya duplikat, bukan karena keputusan.

## Yang dikerjakan

`createMember` mengembalikan kredensial di samping Member — bentuknya mengikuti
`createOrganization`, yang sudah mengembalikan
`credentials: { displayName, name, password }[]` dan sudah punya panel
penampilnya.

`createMemberAction` (`add-form/action.ts:79`) meneruskannya ke pemanggil, dan
formulir menampilkannya sekali dengan peringatan bahwa ia tidak bisa dibuka
lagi. Pakai ulang komponen panel `bulk-upload`; bila ia masih terkurung di dalam
folder `bulk-upload`, promosikan sesuai `AGENTS.md` — generik **dan** dipakai
dua rute — atau jadikan `bulk-upload` pemiliknya dengan `add-form` sebagai
sanctioned consumer lewat barrel. Jangan menyalin komponennya.

Pertimbangkan sekalian membuat `bulk-upload` memakai `createMember` alih-alih
`createUser` langsung, sehingga penerbitan Akun Kader punya satu jalur. Bila itu
membesarkan tiket, catat sebagai tindak lanjut dan jangan paksakan.

## Selesai bila

- Mendaftarkan satu Kader lewat `add-form` menampilkan NIA dan password-nya
  sekali.
- `credential-generation.test.ts` masih hijau — ia sudah menguji bahwa plaintext
  yang ditampilkan cocok dengan hash yang tersimpan, dan itu klaim yang sama
  yang perlu dijaga di sini.
- Tidak ada plaintext yang tersimpan di basis data.

## Comments

**2026-09-11 — selesai, commit `c1a182a` (digabung `1794a27` ke `dev-20260104`).**

`createMember` mengembalikan `credential: { displayName, registerNumber,
password }`; `createMemberAction` meneruskannya, dan `add-form.tsx` memakai
panel `~/components/credential-store` yang sudah dipromosikan — bukan
komponen baru, sesuai arahan tiket. Sekalian dikerjakan: `bulk-upload/action.ts`
kini memanggil `createMember` alih-alih `createUser` langsung, jadi kedua
jalur penerbitan Akun Kader kini satu.

Review menemukan tabrakan nama medan sungguhan (`credential.name` berarti
"NIA" di satu berkas dan "nama tampilan" di berkas lain) — diperbaiki,
diganti seragam jadi `credential.registerNumber`.

Gerbang hijau: `check:types`, `check:lint` (0 galat), `check:structure`,
`check:format`. Suite penuh `bun run test` (setelah digabung ke
`dev-20260104` bersama 02/04/06): 1341 lolos, 0 gagal.
