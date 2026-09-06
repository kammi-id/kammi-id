# 07 — Dashboard BPK: bar Perangkat dan Top 10

Status: done — implementasi sudah masuk dev-20260104 dan deploy non-production; status diperbarui 2026-09-06.

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

## Comments

### 2026-09-06 — sinkronisasi status setelah implementasi dan deploy

Dashboard BPK menampilkan bar Perangkat dan Top 10 distribusi PW/PD; Kader Terhapus dikecualikan dari agregat.

Implementasi: [`6df14ae`](https://github.com/kammi-id/kammi-id/commit/6df14ae). Commit tersebut sudah masuk `dev-20260104`.
[CI dan deploy non-production `d100077`](https://github.com/kammi-id/kammi-id/actions/runs/33590415712)
lulus pada 2026-09-02, 11.30 WIB (test, build-push, deploy). Perubahan tetap
tercakup dalam [rilis `036f467`](https://github.com/kammi-id/kammi-id/actions/runs/33781321956),
yang lulus dan selesai deploy pada 2026-09-04, 00.06 WIB.

Status lama `ready-for-agent` tertinggal setelah implementasi. Pembaruan ini
berdasarkan riwayat commit dan hasil CI yang diperiksa pada 2026-09-06; bukan
pengujian ulang manual seluruh alur dashboard atau verifikasi rilis production.
