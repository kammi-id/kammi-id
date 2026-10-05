---
status: accepted
---

# Production baru hidup di project Dokploy terpisah

Deployment production berikutnya tidak memperbarui Application di project
Dokploy lama. Kami membuat project baru pada server production yang sama,
dengan resource graph yang mengikuti staging: Application, PostgreSQL, named
volume upload, named volume cache Next.js, health check, dan backup. Semua
resource itu baru dan memakai nama, data, secret, kapasitas, serta domain
khusus production. RustFS tetap hidup di project lama untuk melayani legacy
URL `assets.kammi.id` dan menjadi sasaran backup volume.

Project baru dipilih untuk memisahkan lifecycle aplikasi baru dari stack lama
yang membawa sejarah konfigurasi RustFS. Ia bukan batas keamanan maupun
jaringan: Application dan PostgreSQL pada server Dokploy yang sama dapat tetap
bertemu di network Docker bersama, dan nama named volume tidak otomatis
dinamespace per-project. Karena itu database dan volume project lama tidak
boleh dipakai bersama; setiap volume project baru harus bernama unik.

## Considered Options

**Memperbarui project lama** lebih sederhana dan tidak membutuhkan pemindahan
database. Opsi ini ditolak karena mempertahankan konfigurasi lama sebagai
fondasi runtime baru dan membuat pencabutan dependency RustFS sulit dibuktikan.

**Menaruh Application baru di project baru tetapi memakai PostgreSQL lama**
memperkecil pekerjaan cutover. Opsi ini ditolak karena project baru tetap
bergantung pada lifecycle project lama, migrasi schema langsung mengubah
database rollback, dan gangguan network atau credential lama ikut menjatuhkan
aplikasi baru.

**Menaruh project baru di server lain** memberi isolasi host yang nyata. Opsi
ini ditolak untuk deployment ini karena menambahkan perpindahan antar-host,
network, dan volume pada cutover yang sudah memindahkan storage dan database.

## Consequences

Project lama dan project baru berjalan paralel sampai cutover. Application
maintenance sementara memegang apex, `www`, dan wildcard tenant selama write
freeze; Host rule production tidak boleh terpasang pada dua Application
sekaligus.

PostgreSQL baru menerima restore penuh dari `pg_dump -Fc`, sedangkan volume
upload menerima pre-copy dan final delta dari RustFS. Setelah smoke test lulus,
domain berpindah ke Application baru. Begitu trafik tulis dibuka, Application
dan PostgreSQL lama bukan lagi jalur rollback: pemulihan harus memakai image
yang kompatibel dengan volume, roll-forward, atau backup project baru.

Application dan PostgreSQL lama dibekukan read-only sekurang-kurangnya 30 hari
untuk investigasi. RustFS bertahan lebih lama selama legacy URL masih hidup;
keberadaannya tidak membuat aplikasi baru boleh membaca atau menulis S3 lagi.
