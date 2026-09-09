# 04 — Provision project production baru

**What to build:** Project Dokploy production baru tersedia pada server yang
sama dengan resource graph staging, tetapi memiliki Application, PostgreSQL,
volume, environment, dan lifecycle sendiri tanpa mengambil trafik production.

**Blocked by:** None — can start immediately.

**Status:** closed — dikerjakan di luar tiket

- [ ] Project dan environment baru dibuat pada server/Swarm production yang
      disepakati; project lama tidak diubah atau dihentikan.
- [ ] PostgreSQL baru dibuat dengan credential dan database production baru,
      bukan koneksi ke database project lama.
- [ ] Named volume upload dan cache memakai nama unik yang diverifikasi terhadap
      inventory volume host.
- [ ] Upload dan cache dipasang pada mount point yang disepakati dan dimiliki
      UID/GID `1001:1001`.
- [ ] Application memakai satu replica dan hostname validasi yang tidak merebut
      apex, `www`, atau wildcard production.
- [ ] Environment production dikonfigurasi di Dokploy tanpa menyalin nilai
      secret ke repo atau catatan tiket.
- [ ] `RUN_MIGRATIONS` dan acknowledgement database guard tidak terpasang
      permanen pada Application utama.
- [ ] PostgreSQL dan volume project lama tidak dipasang atau dibagi ke
      Application baru.
- [ ] Backup PostgreSQL dan kedua named volume dikonfigurasi dengan retensi serta
      destination yang tercatat tanpa credential.
- [ ] ID resource, nama aktual service/network, mount, dan bukti permission
      dicatat untuk ticket berikutnya tanpa nilai secret.

## Comments

### 2026-09-01 — ditutup di luar tiket

Project `kammi-id-prod` (`aOJQPXVlFDriOkypJjKvJ`), environment `production`
(`7g8uK6jvrUV5lUfCH-kOP`), PostgreSQL `db-0tlzem` (postgres:18.3), Application
`app-78ev7h`, volume `kammi-id-assets` → `/data/uploads` dan `kammi-id-cache` →
`/app/.next/cache` (keduanya `1001:1001`) sudah berdiri sejak 2026-08-29.
Dikerjakan lewat Dokploy API langsung, **bukan** `wizard-04`; kredensial
`DOKPLOY_PROD_*` diberikan manual, disimpan di `provisioning.local.env`.

Bukti: `provisioning-record.local.md` §"Provisioning 2026-08-29T11:14:00Z".

**Tidak diverifikasi:** checklist acceptance tiket ini tidak pernah ditelusuri
baris per baris.
