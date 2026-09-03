# 08 — Teks publik: Visi dan penomoran Kredo

Status: ready-for-agent

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
