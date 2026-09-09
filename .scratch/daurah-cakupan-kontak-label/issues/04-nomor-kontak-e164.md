# 04 — Nomor kontak disimpan dalam format E.164

**What to build:** normalisasi nomor kontak jadi E.164 di lima pintu masuk,
plus backfill data lama yang aman dikonversi.

**Blocked by:** None — can start immediately.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

## Keadaannya

`member.phone` adalah `text` bebas tanpa validasi apa pun. Placeholder-nya
menyarankan `08123456789`, dan yang tersimpan di production memang campur
aduk. Tidak ada kode negara, sehingga nomor Kader PDLN tidak punya tempat yang
benar, dan setiap permukaan yang ingin memakai nomornya menebak formatnya
sendiri — `profile-info.tsx:170` sudah menebak dengan caranya sendiri.

## Aturannya

Karakter pertama yang menentukan (rinciannya di `docs/adr/0026`):

| Diketik | Disimpan |
| --- | --- |
| `08123456789` | `+628123456789` |
| `8123456789` | `+628123456789` |
| `628123456789` | `+628123456789` |
| `+971501234567` | `+971501234567` |
| `00971501234567` | `+971501234567` |

Spasi, tanda hubung, dan tanda kurung dibuang sebelum aturan ini dijalankan.

Nomor Indonesia divalidasi ketat: sesudah `+62` harus mulai `8`, panjang 9–13
digit. Nomor asing hanya dicek bentuk E.164 umum — total 8–15 digit — tanpa
pustaka tambahan. Salah ketik nomor Indonesia yang sering terjadi dan yang
paling merugikan; nomor asing sedikit dan penginputnya tahu nomornya.

Kolom tetap boleh kosong.

## Lima pintu masuk

Normalisasi hidup di **skema Zod sisi server**, satu fungsi dipakai semuanya:

1. `kader/_components/add-form` (`schema.ts:23`)
2. `kader/_components/members-table/inline-quick-add-row`
3. `trainings/_components/training-detail-view/dm1-add-form`
4. `profile/[registerNumber]/_components/profile-info` (sunting)
5. `kader/_components/bulk-upload` (`action.ts:22`, impor XLSX)

Normalisasi yang hanya hidup di klien akan diselundupi impor XLSX besok.

Input-nya tetap satu kolom teks dengan `+62` terpasang di awal; Kader menuliskan
`0812…` karena itu yang mereka hafal, dan normalisasi menerimanya tanpa
mengajari mereka ulang.

## Backfill

Staging per 7 September 2026: 4900 Member, 1927 kosong, 2973 terisi. Dari yang
terisi, **2944 aman dikonversi** dan **29 cacat**. Tidak ada satu pun nomor
berkode negara selain 62.

Yang dikonversi hanya yang tidak kehilangan apa pun: digitnya cocok
`^0?8[0-9]{8,11}$` atau `^628[0-9]{8,11}$` sesudah pemisah dibuang.

Yang cacat **dibiarkan utuh** — `062…` berawalan dobel, `-`, dan yang digitnya
kelebihan. Nomor cacat tetap petunjuk bagi manusia yang akan membetulkannya;
menormalisasinya dengan tebakan membuang informasi yang tidak bisa
dikembalikan. Jangan mengosongkannya.

Angka production diambil ulang sebelum migrasi dijalankan, dan izinnya diminta
saat itu.

## Acceptance

- [x] Satu fungsi normalisasi dipakai kelima pintu masuk
- [x] Kelima baris tabel aturan di atas menghasilkan keluaran yang tepat
- [x] `+62` tanpa awalan `8` ditolak dengan pesan yang bisa dibaca operator
- [x] Nomor asing di luar 8–15 digit ditolak
- [x] Kolom kosong tetap sah
- [x] Backfill mengonversi baris yang aman dan tidak menyentuh yang cacat
- [x] Backfill bisa dijalankan dua kali tanpa merusak (idempoten)
- [ ] Angka production dilaporkan sebelum migrasi dijalankan — **belum**,
      butuh akses production. Skrip backfill sudah ada tapi **belum
      dijalankan** ke database manapun selain test. Lihat Comments.
- [x] Ada tes untuk tiap baris tabel aturan dan untuk penolakannya
- [x] `bun run check:types` lolos

## Comments

### 2026-09-07 — implementasi

Dikerjakan lewat `/implement`, paralel dengan tiket 03, di worktree terpisah,
lalu digabung dengan merge commit `0b4fdaf` ke `dev-20260104`.

- Fungsi bersama di `src/lib/validation/phone.ts`: `normalizePhoneToE164`
  (transformasi murni), `phoneFormField` (field Zod yang menggabungkan
  normalisasi + validasi ketat-IDN/longgar-asing), `decideBackfillPhone`
  (pemeriksaan aman-tidaknya baris lama), `toWaMeDigits` (E.164 tanpa `+`,
  dipakai `profile-info.tsx` menggantikan tebakan ad hoc lama).
- Kelima pintu masuk disambungkan; poin 2 (`inline-quick-add-row`) ternyata
  memakai `memberSchema` yang sama dengan poin 1, jadi tidak perlu
  penyambungan terpisah.
- `src/db/scripts/backfill-phone-e164.ts` ditulis dan diuji lewat integrasi
  terhadap `TEST_DATABASE_URL` (termasuk tes idempotensi eksplisit), tapi
  **belum dijalankan** terhadap database manapun di luar test — menunggu
  hitungan angka production dan izin operator.
- Review Standards + Spec lolos bersih. Satu catatan tidak mengikat dari
  Spec review untuk tiket 05 (tombol WhatsApp MoT): nomor lama yang masih
  cacat berprefiks dobel (`062…`, sengaja tidak disentuh backfill) akan
  menghasilkan tautan `wa.me` yang salah bentuk — bukan kehilangan data,
  tapi layak jadi catatan saat mengerjakan tiket 05.
