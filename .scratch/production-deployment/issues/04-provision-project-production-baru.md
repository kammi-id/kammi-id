# 04 — Provision project production baru

**What to build:** Project Dokploy production baru tersedia pada server yang
sama dengan resource graph staging, tetapi memiliki Application, PostgreSQL,
volume, environment, dan lifecycle sendiri tanpa mengambil trafik production.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

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
