# 08 — Teks publik: Visi dan penomoran Kredo

Status: done — implementasi sudah masuk dev-20260104 dan deploy non-production; status diperbarui 2026-09-06.

Poin 6 dan 7 dari feedback. Paling ringan, tidak bergantung pada tiket mana pun.

## Peringatan: tujuh folder di sini adalah kode mati

`src/app/(main)/[strukturSlug]/tentang/_components/` berisi tujuh folder yang
**tidak pernah dirender**: `kredo-`, `misi-`, `paradigma-`, `prinsip-`,
`karakteristik-`, `sejarah-`, `unsur-section`. Yang hidup hanya `tentang-scene`
(dirender `page.tsx`), `section-nav`, `tentang-hero`, dan `visi-section` (yang
diimpor `tentang-scene`).

Sunting berkas yang salah di sini menghasilkan perubahan yang tidak pernah
tayang. Ini sudah terjadi sekali — poin 7 dilaporkan seolah nomornya belum ada,
padahal `kredo-section` sudah punya, hanya saja ia mati.

## Poin 6 — Visi

`visi-section/visi-section.tsx:69` — hapus kata **"akan"**:

> "Wadah perjuangan permanen yang ~~akan~~ melahirkan kader-kader Pemimpin…"

**Kredo tidak disentuh**, meski kata "akan" juga muncul di sana. Itu teks baku
organisasi, bukan copywriting.

## Poin 7 — Penomoran Kredo

Di `tentang-scene.tsx` (yang hidup), `KREDO_ITEMS` adalah enam paragraf
berselang garis pemisah, **tanpa nomor** — komentar di baris 50 menyebut
"numerals dropped".

- Angka **Arab** `1`–`6`, bukan Romawi.
- Watermark besar **di belakang** teks, `aria-hidden`, tidak mengganggu urutan
  baca maupun seleksi teks.
- Warnanya gelap-transparan di atas parchment. `kredo-section` yang mati
  memakai `text-white/[0.03]`; **jangan disalin** — di atas parchment ia tidak
  akan terlihat sama sekali.

## Selesai bila

- Kata "akan" hilang dari Visi, kredo utuh.
- Enam angka Arab tampil samar di belakang tiap paragraf kredo, di komponen
  yang benar-benar dirender.
- Pembaca layar tidak membacakan angkanya.
- Ketiga `check:*` hijau.

## Comments

### 2026-09-06 — sinkronisasi status setelah implementasi dan deploy

Kata «akan» dihapus dari Visi dan paragraf Kredo diberi nomor.

Implementasi: [`bfcceeb`](https://github.com/kammi-id/kammi-id/commit/bfcceeb). Commit tersebut sudah masuk `dev-20260104`.
[CI dan deploy non-production `d100077`](https://github.com/kammi-id/kammi-id/actions/runs/33590415712)
lulus pada 2026-09-02, 11.30 WIB (test, build-push, deploy). Perubahan tetap
tercakup dalam [rilis `036f467`](https://github.com/kammi-id/kammi-id/actions/runs/33781321956),
yang lulus dan selesai deploy pada 2026-09-04, 00.06 WIB.

Status lama `ready-for-agent` tertinggal setelah implementasi. Pembaruan ini
berdasarkan riwayat commit dan hasil CI yang diperiksa pada 2026-09-06; bukan
pengujian ulang manual seluruh alur dashboard atau verifikasi rilis production.
