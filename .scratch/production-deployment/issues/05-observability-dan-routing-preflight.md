# 05 — Observability dan routing preflight

**What to build:** Operator dapat membuktikan project baru terpantau, log-nya
dapat didiagnosis, dan seluruh routing/TLS production siap dipindahkan tanpa
mengganggu exact route RustFS.

**Blocked by:** 01 — Health endpoints production; 04 — Provision project
production baru.

**Status:** ready-for-human

- [ ] Liveness dan readiness Application baru terhubung ke health policy
      Dokploy dan menunjukkan keadaan dependency yang benar.
- [ ] External uptime monitor memeriksa endpoint yang disepakati dan jalur
      notifikasi insiden telah diuji sampai penerima.
- [ ] Log Application dan PostgreSQL dapat diakses oleh incident responder dan
      credential tetap teredaksi.
- [ ] Apex, `www`, dan wildcard satu-level tenant mempunyai DNS serta TLS valid
      pada server production.
- [ ] Reverse proxy terbukti mempertahankan header `Host` untuk apex dan satu
      tenant Host.
- [ ] Exact route `assets.kammi.id` terbukti menang atas wildcard dan tetap
      menuju RustFS project lama.
- [ ] Dua Application tidak memiliki Host rule production yang sama pada saat
      yang sama.
- [ ] Kapasitas disk, network aktual, sesi PostgreSQL, dan akses operator
      diperiksa sebelum rehearsal.
- [ ] Backup schedule terlihat sehat, sementara restore viability tetap menjadi
      acceptance gate rehearsal end-to-end.
- [ ] Seluruh bukti preflight dicatat tanpa nilai secret.
