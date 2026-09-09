# 03 — Kader yang didaftarkan satu per satu tidak pernah bisa masuk

**What to build:** `createMember` mengembalikan plaintext kredensialnya, dan
`add-form` menampilkannya lewat panel yang sudah dipakai `bulk-upload`.

**Blocked by:** 01

**Status:** ready-for-agent

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
