# 07 — Dashboard BPK: bar Perangkat dan Top 10

Status: ready-for-agent

Poin 11 dan 12 dari feedback.

## Poin 11 — Perangkat menjadi bar

`KaderPerangkatCard` (`_components/kader-bento-stats/`) sekarang sengaja
**bukan** chart; komentarnya menyebut "stat pair — no chart for 2 values".
Diputuskan: jadikan **dua bar, apa adanya**.

Konsekuensi yang disadari: keduanya bisa mencacah orang yang sama (satu Kader
bisa Pemandu **dan** Instruktur), dan bar-nya tidak punya baseline bersama —
tingginya hanya bisa dibandingkan satu sama lain, bukan terhadap total Kader.
Jangan menambahkan sumbu total tanpa perintah.

## Poin 12 — Cukup Top 10

`readMemberDistributionByOrgType` (`src/db/query/member.ts:756`) sudah
`ORDER BY count DESC` **tanpa `LIMIT`**, sehingga daftar PD bisa ratusan baris.

- `LIMIT 10` **di SQL**, untuk daftar PW **dan** PD.
- **Tanpa** baris "Lainnya".
- Judul menjadi eksplisit — "Top 10 PW", "Top 10 PD" — supaya daftar terpotong
  tidak terbaca sebagai daftar lengkap.

## Sekalian: kader terhapus ikut terhitung

`LEFT JOIN member` di query itu menyaring `is_alumn`, `is_suspended`, dan
`is_non_active` — tapi **tidak** `m.deleted_at IS NULL`. Kader yang sudah
dihapus masih ikut dihitung, dan itu bisa mengubah peringkat Top 10. Tambahkan
saringannya.

## Selesai bila

- Kedua daftar mengembalikan maksimal 10 baris dari SQL (tes).
- Kader ber-`deleted_at` tidak ikut terhitung (tes).
- Judul menyebut "Top 10".
- Ketiga `check:*` hijau.
