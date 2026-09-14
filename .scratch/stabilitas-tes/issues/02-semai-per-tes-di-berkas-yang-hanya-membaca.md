# 02 — Semai per-tes di berkas yang hanya membaca

**What to build:** Berkas tes yang tidak mengubah apa pun menyemai sekali di
`beforeAll`, bukan `TRUNCATE` + semai ulang di tiap `beforeEach`.

**Blocked by:** None. Berdiri sendiri dari tiket 01 — ini meringankan gejala,
tiket 01 menyentuh sebabnya.

**Status:** done

`tests/access-control.test.ts` menyemai hierarki enam Struktur (PP → dua PW → PD
→ dua PK) di `beforeEach`, lalu ketujuh tesnya cuma memanggil
`fetchAllowedOrgIds` dan memeriksa hasilnya. Tidak satu pun menulis. Jadi enam
dari tujuh semai itu membangun ulang keadaan yang identik dengan yang barusan
dihapus.

Polanya sudah pernah diperbaiki sekali. `src/lib/auth/kekaderan.test.ts`
dipindah ke `beforeAll` dan turun dari **48 detik jadi 5 detik**, hijau tiga kali
berturut-turut.

## Kenapa ini aman di sini

Ada satu jebakan yang kelihatannya membatalkan pemindahan ini:
`fetchAllowedOrgIds` (`src/db/query/organization.ts`) dibungkus `cache()` React.
Kalau ia memoize, tes kedua dan seterusnya akan melihat nilai basi dari semai
yang pertama.

Ia tidak memoize. `cache()` hanya hidup di dalam konteks request, dan tes tidak
punya satu pun — sudah diprobe langsung. Perhatikan juga ia di-key pada
**primitif**, bukan objek; kalau di-key pada objek, tiap pemanggil membuat
literal baru dan cache-nya tidak pernah kena sama sekali.

Catat ini di komentar berkas tesnya. Tanpa itu, orang berikutnya akan
mengembalikannya ke `beforeEach` "supaya aman".

## Bentuknya

Sapu kesembilan berkas ber-`TRUNCATE` (daftarnya ada di tiket 01), pisahkan yang
hanya membaca dari yang menulis. Yang membaca pindah ke `beforeAll`. Yang
menulis **tetap** `beforeEach` — jangan dipaksa, isolasi antar-tes lebih mahal
untuk dilepas daripada beberapa detik.

Sudah pasti menulis, jangan disentuh: `delete-member`, `delete-training`,
`delete-member-button`, `reset-password`, `bulk-upload`,
`training-detail-view/action.test.ts` (yang terakhir menghapus baris Peserta).

- [x] `tests/access-control.test.ts` menyemai di `beforeAll`
- [x] Alasan `cache()` tidak jadi masalah tercatat di komentar berkasnya
- [x] Berkas ber-`TRUNCATE` lain sudah disapu; yang menulis dibiarkan `beforeEach`
- [x] Seluruh tes lolos

## Comments

**19 Agustus 2026 — hanya satu berkas yang memang perlu dipindah.**

Disapu kesembilan berkas ber-`TRUNCATE`. Delapan sudah pasti menulis di badan
tesnya sendiri (`delete-member`, `delete-training`, `delete-member-button`,
`reset-password`, `bulk-upload`, `training-detail-view/action.test.ts`, dan
dua lagi yang ikut terverifikasi menulis: `organization-state.test.ts` lewat
`db.update`/`DELETE` langsung, dan `add-training-modal/action.test.ts` lewat
`createTrainingAction`) — semuanya dibiarkan `beforeEach`, tidak disentuh.

Sisa satu: `tests/access-control.test.ts`, persis yang disebut tiket ini.
Ketujuh tesnya cuma memanggil `fetchAllowedOrgIds` dan memeriksa hasilnya.
Dipindah ke `beforeAll`, dengan komentar di berkasnya yang mencatat kenapa
`cache()` React tidak jadi masalah di sana (konteks per-request yang tidak
dimiliki tes, dan key-nya primitif bukan objek) — persis alasan yang sudah
diverifikasi di `kekaderan.test.ts`, yang jadi rujukan bentuknya.

`src/app/(dashboard)/dashboard/branches/_components/move-parent/action.test.ts`
sempat kelihatan seperti kandidat lain, tapi TRUNCATE-nya sudah di `beforeAll`
sejak tiket 29 — `beforeEach`-nya cuma mengembalikan satu kolom yang
benar-benar berubah antar tes, bukan menyemai ulang.

Bukti: `tests/access-control.test.ts` 7/7 lolos, 2.08 detik (dari beforeEach
yang tadinya rentan `hook timed out` di basis data remote). Dijalankan bersama
`organization-state.test.ts` dan `kekaderan.test.ts`: 29/29 lolos.
