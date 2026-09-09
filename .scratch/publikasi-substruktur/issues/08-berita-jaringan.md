# 08 — Berita Jaringan di Situs PP

**What to build:** Beranda PP mendapat satu bagian tambahan berisi 12 Berita terbaru dari seluruh Struktur, dan `/berita/jaringan` menampung arsip nasionalnya dengan paginasi yang sama seperti arsip per Struktur. Setiap kartu mengantar pembaca ke Permalink di Situs Struktur penerbitnya, bukan ke salinan di PP. `kammi.id/berita` tetap berisi Berita PP saja.

**Blocked by:** 07

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

- [x] Beranda PP menampilkan 12 Berita terbaru lintas Struktur dan menautkan ke `/berita/jaringan`.
- [x] `/berita/jaringan` menampilkan seluruh Berita lintas Struktur, kronologis, 48 per halaman.
- [x] Bagian dan halaman ini hanya ada pada Situs PP, dikondisikan pada Jenjang Struktur, bukan pada jalur routing yang berbeda (ADR 0012).
- [x] Setiap kartu menautkan ke Permalink di Situs Struktur penerbitnya, dan nama Struktur itu terbaca pada kartu.
- [x] Query menyaring Struktur Terhapus dan Situs yang belum aktif; penyaringan Keadaan Non-Aktif menyusul di tiket 11 (ADR 0013).
- [x] Penelusuran rekursif tidak dipakai — PP adalah akar pohon, penyaringan Keadaan sudah cukup.
- [x] Indeks parsial untuk urutan kronologis lintas Struktur ditambahkan.
- [x] Berita Jaringan punya tag cache sendiri, terpisah dari tag per Struktur.

## Comments

Query baru `listBeritaJaringan`/`listLatestBeritaJaringan` di `src/db/query/article.ts` — bentuk sama persis dengan `listBeritaArsipForOrg`/`listLatestBeritaForOrg` (tiket 07), tapi filter Strukturnya beda per ADR 0013: `isNull(organization.deletedAt)` + `eq(organization.isSiteActive, true)` pada kolom yang di-JOIN, TANPA menyaring `isNonActive` (diuji eksplisit di `article.test.ts`). Index parsial baru `article_terbit_jaringan_idx` (`published_at DESC, id DESC` WHERE `type='blog' AND status='published'`, tanpa `organization_id`) — migrasinya sudah digenerate dan digabung di sini (beda dari tiket 07 yang menundanya ke sesi integrasi terpisah; tiket ini dikerjakan solo jadi tidak ada tabrakan migrasi paralel untuk dihindari).

Tautan kartu Berita Jaringan ABSOLUT (`https://<host-struktur>/berita/...`) via `resolveStrukturHost` — beda dari kartu arsip per-Struktur yang pakai path relatif — karena kartu ini tampil di Situs PP tapi harus mengantar ke Situs Struktur penerbitnya, origin berbeda.

Cache tag `berita-jaringan` (terpisah dari `article-<idStruktur>`) dipasang di `berita-jaringan-section/data.ts` dan `berita-jaringan-archive/data.ts`, dan disambungkan ke SEMUA action yang mengubah Keadaan/Situs Aktif Struktur per tuntutan ADR 0013: `deactivateStrukturAction`, `reactivateStrukturAction`, `deleteStrukturAction`, `setSiteActiveAction`, dan `restoreStrukturAction` (pemulihan dari Terhapus — ditemukan action ini sudah ada, tiket 12 rupanya sudah berjalan).

Review `/code-review` (dua sub-agent paralel, Standards + Spec axis): Spec axis lolos penuh, nol temuan. Standards axis nol hard violation; satu judgement call ditindaklanjuti — `buildPaginationItems` (fungsi murni, dipakai `berita-archive` dan `berita-jaringan-archive`) dipromosikan ke `src/lib/utils/pagination.ts` karena sudah memenuhi bar promosi AGENTS.md (generik DAN dipakai ≥2 rute), beda dari duplikasi permalink helper yang dibiarkan mengikuti preseden tiket 07.
