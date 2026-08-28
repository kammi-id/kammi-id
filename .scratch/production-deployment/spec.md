# Deployment production ke project Dokploy baru

**Status:** ready-for-agent

Keputusan arsitektur sudah diterima dalam
[ADR 0015](../../docs/adr/0015-production-baru-di-project-dokploy-terpisah.md).
Urutan operator yang disepakati hidup dalam
[runbook production deployment](../../docs/operations/production-deployment.md).
Spec ini menetapkan pekerjaan yang membuat runbook itu dapat dieksekusi dan
menentukan bukti yang wajib ada sebelum production menerima trafik.

## Problem Statement

KAMMI ID belum mempunyai jalur production yang dapat dijalankan dengan aman
dari keadaan repo saat ini. CI sudah menguji dan membangun image, staging sudah
menerima deployment otomatis untuk branch pengembangan, tetapi `main` belum
punya deployment production. Production lama juga masih menyimpan gambar di
RustFS, sedangkan aplikasi kandidat hanya membaca volume lokal.

Memperbarui project Dokploy lama secara langsung akan mencampur konfigurasi
legacy dengan aplikasi baru dan membuat titik rollback sulit dibuktikan. Di
saat yang sama, membuat project baru berarti Application, PostgreSQL, volume,
domain, migrasi, dan byte gambar harus berpindah dalam satu cutover yang
fail-closed. Migration journal production pernah tidak lengkap, constraint baru
dapat menolak data aktual, dan placeholder gambar tetap mengembalikan HTTP 200
saat berkas hilang. Status “container hidup” karena itu bukan bukti bahwa rilis
berhasil.

Operator membutuhkan satu rencana yang menjawab empat hal tanpa asumsi diam:

1. artefak mana yang boleh naik;
2. bagaimana project baru dibangun tanpa berbagi data plane dengan project
   lama;
3. bagaimana database dan gambar dipindahkan dengan RPO nol;
4. kapan rollback ke stack lama masih aman dan kapan ia harus ditutup.

## Solution

Rilis dilakukan sebagai controlled manual deployment ke project baru pada
server Dokploy production yang sama. Project baru meniru resource graph staging
tetapi memiliki Application, PostgreSQL, named volume upload, named volume cache,
secret, backup, dan nama resource production sendiri. RustFS tetap hidup di
project lama untuk legacy URL `assets.kammi.id` dan sebagai sasaran backup; ia
tidak kembali menjadi dependency runtime aplikasi.

SHA final dari `main` dibekukan, diuji di staging, dan dipromosikan ke
production sebagai digest image yang sama. Sebelum hari-H, seluruh alur
direhearsal pada salinan data production, termasuk restore, rekonsiliasi
migration journal, pemeriksaan duplikat, migrasi, asset mirror, health check,
smoke test, dan rollback.

Pada hari-H, Application maintenance mengambil apex, `www`, dan wildcard
tenant; semua write berhenti. Final `pg_dump -Fc` direstore penuh ke PostgreSQL
baru, final asset delta menjadikan volume mirror persis RustFS, migrasi berjalan
dari one-shot container dengan digest release yang sama, lalu kandidat diuji
sebelum domain dipindahkan. Setelah write pertama diterima project baru, stack
lama tidak lagi menjadi rollback langsung. Pemulihan selanjutnya berlangsung
di project baru melalui image kompatibel-volume, roll-forward, atau backup baru.

## User Stories

1. Sebagai deployment lead, saya ingin satu SHA kandidat dibekukan sebelum
   rehearsal, sehingga seluruh bukti merujuk kode yang sama.
2. Sebagai deployment lead, saya ingin production menjalankan digest image yang
   sudah diuji di staging, sehingga tidak ada rebuild yang mengubah artefak.
3. Sebagai peninjau rilis, saya ingin seluruh quality gate selesai sebelum
   maintenance, sehingga kegagalan kode ditemukan sebelum trafik disentuh.
4. Sebagai product/data owner, saya ingin keputusan go/no-go membutuhkan bukti
   tertulis, sehingga deployment tidak bergantung pada keyakinan operator.
5. Sebagai product/data owner, saya ingin dapat membatalkan deployment sebelum
   write freeze tanpa perubahan production, sehingga persiapan yang gagal tidak
   menjadi insiden.
6. Sebagai operator Dokploy, saya ingin project production baru mengikuti
   resource graph staging, sehingga pola yang sudah terbukti dipakai kembali.
7. Sebagai operator Dokploy, saya ingin PostgreSQL baru dimiliki project baru,
   sehingga lifecycle database tidak bergantung pada project lama.
8. Sebagai operator Dokploy, saya ingin volume upload baru bernama unik,
   sehingga project baru tidak tanpa sengaja memasang volume project lama.
9. Sebagai operator Dokploy, saya ingin cache Next.js hidup di named volume
   persisten, sehingga optimasi gambar tidak dingin kembali setiap redeploy.
10. Sebagai operator Dokploy, saya ingin kedua volume dimiliki UID/GID 1001,
    sehingga Application non-root dapat membaca dan menulisnya.
11. Sebagai operator keamanan, saya ingin project baru memakai secret production
    sendiri, sehingga tidak ada credential staging atau legacy yang terbawa.
12. Sebagai operator keamanan, saya ingin nilai secret tetap berada di secret
    manager Dokploy, sehingga runbook dan catatan rilis tidak membocorkannya.
13. Sebagai operator keamanan, saya ingin project Dokploy tidak dianggap sebagai
    security boundary, sehingga network bersama diperiksa secara eksplisit.
14. Sebagai operator database, saya ingin target PostgreSQL baru diverifikasi
    sebelum restore, sehingga versi, kapasitas, dan credential benar.
15. Sebagai operator database, saya ingin restore rehearsal memakai salinan data
    production, sehingga bentuk data aktual menguji migrasi kandidat.
16. Sebagai operator database, saya ingin migration journal direkonsiliasi satu
    per satu, sehingga efek schema yang sudah ada tidak dijalankan ulang secara
    membabi buta.
17. Sebagai operator database, saya ingin migrasi yang benar-benar belum
    diterapkan tetap dijalankan, sehingga journal tidak dipalsukan hanya untuk
    membuat container hidup.
18. Sebagai operator database, saya ingin duplikat `organization.code` dan
    `organization.slug` diperiksa tepat sebelum migrasi, sehingga unique
    constraint tidak gagal di tengah cutover.
19. Sebagai penjaga Nomor Induk Anggota, saya ingin duplikat `code` menghentikan
    deployment dan meminta keputusan manusia, sehingga identitas Kader tidak
    diubah secara mekanis.
20. Sebagai operator database, saya ingin migrasi memakai lock timeout 10 detik,
    sehingga DDL tidak menunggu tanpa batas.
21. Sebagai operator database, saya ingin migration batch gagal secara atomik,
    sehingga aplikasi tidak menerima schema setengah naik.
22. Sebagai deployment lead, saya ingin dump dan restore penuh selesai dalam
    rehearsal di bawah anggaran window, sehingga target RTO 60 menit realistis.
23. Sebagai deployment lead, saya ingin final database dump diambil setelah
    write freeze, sehingga tidak ada write production yang tertinggal.
24. Sebagai operator storage, saya ingin seluruh key RustFS disalin tanpa
    perubahan nama, sehingga tidak ada baris database yang perlu ditulis ulang.
25. Sebagai operator storage, saya ingin pre-copy dilakukan sebelum maintenance,
    sehingga final asset sync cukup memindahkan delta.
26. Sebagai operator storage, saya ingin final destination menjadi mirror persis
    sumber, sehingga objek yang sudah dihapus tidak tertinggal diam-diam.
27. Sebagai operator storage, saya ingin jumlah file, total byte, dan manifest
    hash cocok, sehingga placeholder HTTP 200 tidak menyamarkan kehilangan data.
28. Sebagai pembaca Situs Struktur, saya ingin foto Kader, logo Struktur, dan
    gambar Artikel lama tetap tampil, sehingga cutover storage tidak merusak
    publikasi.
29. Sebagai Humas, saya ingin upload gambar baru berhasil setelah cutover,
    sehingga volume baru terbukti dapat ditulis oleh Application.
30. Sebagai pembaca legacy URL, saya ingin `assets.kammi.id` tetap melayani
    gambar lama, sehingga alamat yang sudah tersebar tidak putus.
31. Sebagai operator backup, saya ingin volume baru dibackup ke RustFS dan
    snapshot provider, sehingga RustFS berubah peran tanpa kehilangan manfaat
    pemulihannya.
32. Sebagai pengunjung production, saya ingin melihat maintenance page selama
    write freeze, sehingga saya tidak menerima error acak atau menulis ke stack
    yang sedang dipindahkan.
33. Sebagai operator routing, saya ingin satu Host rule production hanya
    dimiliki satu Application pada satu waktu, sehingga Traefik tidak memilih
    backend secara ambigu.
34. Sebagai operator routing, saya ingin apex, `www`, dan wildcard tenant
    memiliki TLS valid sebelum cutover, sehingga seluruh Situs Struktur tetap
    aman diakses.
35. Sebagai operator routing, saya ingin exact route `assets.kammi.id` menang
    atas wildcard tenant, sehingga RustFS tidak dibaca sebagai slug Struktur.
36. Sebagai operator routing, saya ingin reverse proxy mempertahankan header
    `Host`, sehingga Situs Struktur yang benar dipilih pada setiap subdomain.
37. Sebagai operator, saya ingin liveness membuktikan proses hidup tanpa
    dependency eksternal, sehingga restart policy tidak dipicu oleh gangguan
    database sementara.
38. Sebagai operator, saya ingin readiness membuktikan PostgreSQL dan volume
    upload siap, sehingga trafik tidak menuju instance yang belum dapat
    melayani fungsi inti.
39. Sebagai operator, saya ingin API wilayah/universitas tidak menjadi
    dependency readiness, sehingga gangguan layanan tambahan tidak menjatuhkan
    seluruh Application.
40. Sebagai incident responder, saya ingin external uptime monitor dan jalur
    notifikasi teruji sebelum cutover, sehingga kegagalan setelah trafik dibuka
    segera diketahui.
41. Sebagai incident responder, saya ingin log production dapat diakses dan
    credential tetap teredaksi, sehingga diagnosis tidak memperbesar insiden.
42. Sebagai pemegang Akun Kepengurusan smoke test, saya ingin login dan logout
    production berhasil, sehingga session dan cookie production terbukti benar.
43. Sebagai pemegang Akun Kepengurusan smoke test, saya ingin data yang terlihat
    mengikuti Cakupan, sehingga cutover tidak memperlebar atau mempersempit
    kewenangan secara diam-diam.
44. Sebagai product/data owner, saya ingin smoke test memakai Struktur nyata dan
    mutasi reversibel, sehingga deployment tidak mencemari domain dengan
    Struktur atau Kader fiktif.
45. Sebagai product/data owner, saya ingin seluruh smoke test lulus sebelum
    write dibuka, sehingga stack lama masih menjadi jalan pulang yang utuh saat
    kandidat gagal.
46. Sebagai deployment lead, saya ingin checkpoint project baru diambil sebelum
    trafik dibuka, sehingga insiden sesudah cutover punya titik pemulihan baru.
47. Sebagai deployment lead, saya ingin batas rollback dicatat tepat ketika
    write dibuka, sehingga tidak ada yang mengaktifkan stack lama dengan data
    tertinggal.
48. Sebagai incident responder, saya ingin rollback setelah write memakai image
    kompatibel-volume, roll-forward, atau backup baru, sehingga data baru tidak
    hilang lewat reverse cutover yang tidak disiapkan.
49. Sebagai incident responder, saya ingin stack lama tetap utuh tetapi tanpa
    writer selama 30 hari, sehingga bukti investigasi tersedia tanpa menjadi
    production bayangan.
50. Sebagai product/data owner, saya ingin penghapusan stack lama menjadi
    pekerjaan terpisah dengan konfirmasi, sehingga runbook deployment tidak
    melakukan tindakan irreversibel.
51. Sebagai deployment lead, saya ingin pengawasan aktif berlangsung minimal 60
    menit, sehingga regresi cepat ditemukan sebelum tim bubar.
52. Sebagai operator, saya ingin pemantauan diperketat selama 24 jam, sehingga
    masalah yang muncul setelah cache hangat atau trafik normal tetap terlihat.
53. Sebagai peninjau, saya ingin catatan rilis memuat SHA, digest, backup,
    migration journal, asset manifest, smoke test, dan keputusan go/no-go,
    sehingga deployment dapat diaudit kemudian.
54. Sebagai agen implementasi, saya ingin pekerjaan yang membutuhkan akses
    production dibedakan dari pekerjaan repo, sehingga saya tidak menebak
    secret atau keadaan host.

## Implementation Decisions

### Bentuk rilis

- Deployment adalah proses manual satu kali. Production CD, canary, dan
  zero-downtime tidak dibangun dalam pekerjaan ini.
- Kandidat berasal dari `main`. Setiap perubahan setelah freeze menghasilkan
  SHA baru dan mengulang seluruh gate.
- CI membangun image immutable. Digest yang diuji pada staging adalah digest
  yang dipromosikan; production tidak rebuild.
- Release mempunyai deployment lead dan product/data owner yang berbeda. Yang
  pertama mengeksekusi, yang kedua memutuskan go/no-go atau pemulihan.

### Topologi Dokploy

- Project baru ditempatkan pada server/Swarm production yang sama dengan
  project lama.
- Kesamaan dengan staging berarti resource graph dan wiring yang sama, bukan
  reuse nama, secret, data, kapasitas, atau domain.
- Project baru memiliki Application, PostgreSQL, named volume upload, named
  volume cache Next.js, health check, backup, dan konfigurasi observability.
- PostgreSQL dan volume project lama tidak dipasang ke Application baru.
- Nama named volume wajib unik secara host karena project bukan namespace
  volume maupun security/network boundary.
- Application berjalan satu replica selama cutover. Strategi shared cache dan
  multi-replica tidak diperkenalkan.
- Upload volume dipasang pada direktori yang ditunjuk `UPLOADS_DIR`; cache
  volume dipasang pada cache Next.js. Keduanya harus dimiliki UID/GID 1001.

### Runtime dan health

- Tambahkan dua endpoint eksternal: liveness dan readiness.
- Liveness hanya membuktikan proses HTTP mampu menjawab; ia tidak mengakses
  PostgreSQL, volume, atau API pihak ketiga.
- Readiness gagal tertutup bila PostgreSQL tidak dapat menjawab query ringan
  atau upload volume tidak tersedia dengan permission baca/tulis yang benar.
- API wilayah/universitas tidak masuk readiness karena bukan dependency setiap
  request dan gangguannya tidak boleh mengeluarkan Application dari trafik.
- Health response tidak membocorkan DSN, path host, credential, schema, atau
  detail exception. Status HTTP adalah kontrak utama untuk proxy/monitor.
- Application maintenance adalah artefak statis kecil tanpa PostgreSQL, secret
  aplikasi, atau dependency RustFS. Ia dapat memiliki apex, `www`, dan wildcard
  tenant selama cutover.

### Environment dan secret

- Application production membutuhkan koneksi PostgreSQL, direktori upload,
  token API wilayah/universitas, secret revalidasi cache, serta environment
  runtime biasa. Spec hanya mengatur nama kontrak, tidak nilai.
- `RUN_MIGRATIONS` dan acknowledgement DB guard tidak dipasang permanen pada
  Application utama.
- Secret divalidasi sebelum maintenance dan dirotasi hanya bila bocor atau jatuh
  tempo. Rotasi semua secret bukan bagian cutover.
- Provider alerting dan secret manager tidak dipaksakan; Dokploy tetap sumber
  kebenaran environment production.

### Database dan migrasi

- PostgreSQL project baru menerima restore penuh `pg_dump -Fc`; Application
  baru tidak pernah memakai database lama sebagai data plane.
- Restore rehearsal dan final restore memakai opsi clean, mengabaikan ownership
  sumber, dan mempertahankan privilege target sesuai prosedur yang sudah
  dibuktikan staging.
- Restore menimpa migration journal. Setiap migration folder yang tidak tercatat
  diverifikasi terhadap efek SQL aktual sebelum diputuskan sudah applied atau
  benar-benar pending.
- Tidak ada generalisasi “semua migration lama sudah ada”. Ambiguitas pada satu
  migration menghentikan release.
- Existing preflight duplikat menjadi bagian release artifact atau one-shot
  tooling yang menggunakan digest/source kandidat yang sama. Ia tetap read-only
  dan memakai DB guard.
- Duplikat `organization.code` menghentikan rilis dan menjadi insiden data.
  Duplikat `slug` diselesaikan melalui pekerjaan koreksi yang diaudit sebelum
  rilis diulang; `code_slug` tidak mendapat constraint.
- Migrasi production dijalankan dari one-shot container dengan digest kandidat
  yang sama, bukan dari container lama atau source checkout yang tidak dipatok.
- One-shot container memakai acknowledgement DB guard eksplisit, berjalan pada
  network PostgreSQL baru, mengeksekusi migrasi, lalu berhenti tanpa melayani
  HTTP.
- Lock timeout 10 detik wajib dibuktikan dalam rehearsal pada koneksi yang
  benar-benar dipakai migrator. Kegagalan memperoleh lock membatalkan batch dan
  release.
- Tidak ada down migration. Database lama tidak disentuh migrasi, sehingga
  rollback sebelum write dibuka cukup mengembalikan Host rule ke stack lama.

### Storage dan cache

- RustFS tetap di project lama. Aplikasi baru tidak membawa S3 client, S3
  credential, atau fallback dua-sumber.
- Pre-copy memindahkan object RustFS ke upload volume sebelum maintenance. Final
  delta setelah write freeze menghasilkan mirror persis, termasuk menghapus
  destination object yang sudah tidak ada di sumber.
- Object key dipertahankan byte-for-byte sebagai relative path; database dan
  legacy URL tidak ditulis ulang.
- Verifikasi memakai jumlah file, total byte, dan manifest hash. HTTP 200 dari
  image route tidak cukup karena placeholder juga menjawab 200.
- Operasi copy yang berjalan sebagai root selalu diikuti penegakan ownership
  UID/GID 1001.
- Cache optimizer Next.js memakai named volume persisten sesuai ADR storage dan
  cache yang sudah diterima.
- Backup upload/cache volume dikonfigurasi lewat Dokploy dan provider snapshot;
  aplikasi tidak menulis ganda ke RustFS.

### Routing dan cutover

- Project lama dan baru hidup paralel selama preparation, tetapi hanya satu
  Application memiliki Host rule production pada satu waktu.
- Karena kedua project berada pada server yang sama, cutover normal adalah
  perpindahan router Traefik, bukan perubahan DNS. DNS hanya diubah bila
  preflight membuktikan record salah.
- Urutan Host rule adalah Application lama → Application maintenance →
  Application baru. Tidak ada periode dua pemilik.
- Apex, `www`, wildcard satu-level tenant, TLS, dan preservation header `Host`
  diverifikasi sebelum maintenance.
- Exact route `assets.kammi.id` tetap menunjuk RustFS dan harus menang atas
  wildcard Application.
- Hostname validasi yang bukan subdomain tenant dapat menguji apex/dashboard.
  Tenant diuji dari network internal dengan header `Host` yang sesuai tanpa
  merebut wildcard production lebih awal.

### Maintenance, RPO, dan rollback

- Maintenance window ditargetkan 30–60 menit. Deadline abort ditetapkan sebelum
  write freeze.
- Setelah maintenance page aktif, Application lama tidak memiliki domain dan
  tidak menerima write. Sesi database writer diverifikasi kosong tanpa mematikan
  sesi secara paksa.
- Snapshot lama, final dump, dan final asset sync diambil setelah write berhenti;
  target RPO cutover adalah nol.
- Kandidat menerima trafik hanya setelah migration, readiness, smoke test, dan
  checkpoint project baru lulus.
- Sebelum write dibuka, kegagalan mengembalikan domain ke Application lama yang
  tetap memakai PostgreSQL dan RustFS lama.
- Setelah write dibuka, reverse sync ke database/RustFS lama tidak dibangun.
  Pemulihan tetap berada di project baru.
- Application lama dihentikan dan tanpa Host rule; PostgreSQL lama dipertahankan
  tanpa writer minimal 30 hari. RustFS bertahan selama legacy URL masih ada.
- Penghapusan stack lama bukan bagian deployment dan selalu membutuhkan
  pekerjaan serta konfirmasi tersendiri.

### Smoke test dan observability

- Smoke test memakai Akun Kepengurusan khusus pada Struktur nyata dengan hak
  minimum; tidak membuat Struktur atau Kader fiktif.
- Smoke test mencakup login/logout, session cookie, pembacaan sesuai Cakupan,
  apex, `www`, tenant wildcard, Situs Struktur, Berita/permalink, gambar lama,
  upload baru, mutasi reversibel, audit, cache invalidation, dan log.
- Artefak smoke test tidak diterbitkan dan dibersihkan melalui jalur aplikasi
  yang disepakati.
- External uptime monitor, akses log teredaksi, dan satu jalur notifikasi insiden
  merupakan release blocker. Full metrics stack bukan requirement.
- Pengawasan aktif berlangsung minimal 60 menit setelah trafik dibuka dan
  pemantauan diperketat berlangsung 24 jam.
- Catatan rilis menyimpan bukti SHA/digest, gate, migration journal, durasi,
  asset manifest, backup/restore, health, smoke test, domain handoff, dan
  keputusan kedua peran—tanpa nilai secret.

## Testing Decisions

### Seam utama

Satu seam tertinggi menjadi bukti penerimaan: **release rehearsal end-to-end
pada project Dokploy baru menggunakan salinan production dan digest image
final**. Test dimulai dari project baru yang belum menerima trafik dan berakhir
ketika kandidat lulus health/smoke test serta rollback ke stack lama terbukti
sebelum write dibuka.

Seam ini dipilih karena risiko utama berada pada hubungan antar-system—Dokploy,
Traefik, PostgreSQL, migration journal, Docker volume, RustFS, session cookie,
dan tenant Host routing. Unit test terhadap helper tidak dapat membuktikan
resource itu terhubung benar. Rehearsal menguji perilaku eksternal yang sama
dengan production tanpa mengubah production.

Kriteria seam utama:

- digest staging dan kandidat production identik;
- restore production copy, journal reconciliation, duplicate preflight, dan
  migration selesai;
- volume mirror cocok berdasarkan count, bytes, dan hash;
- liveness/readiness berubah sesuai keadaan dependency;
- seluruh smoke test domain berhasil;
- Host rule dapat berpindah ke maintenance/kandidat dan kembali tanpa dua
  pemilik;
- abort menyisakan stack lama utuh dan melayani kembali;
- total waktu berada di bawah maintenance/RTO budget.

### Supporting tests

- Health endpoint diuji pada seam HTTP: status dan response aman ketika proses
  sehat, PostgreSQL gagal, volume hilang, atau permission volume salah. Test
  mengamati respons, bukan helper internal.
- Existing duplicate preflight diuji pada database dengan nol duplikat,
  duplikat `slug`, duplikat `code`, soft-deleted Struktur, dan kombinasi yang
  membedakan cakupan constraint. Hasil dan exit decision adalah kontraknya.
- One-shot migration path diuji pada PostgreSQL kosong, production-like upgrade,
  migration idempotent, lock timeout, dan batch failure. Bukti akhirnya adalah
  schema/journal serta exit status container.
- Maintenance Application diuji dari HTTP untuk apex dan satu Host tenant; ia
  harus tetap menjawab saat PostgreSQL/RustFS tidak tersedia.
- Routing diuji dari luar dan dari network internal: apex, redirect `www`, satu
  tenant, exact `assets`, dan preservation `Host`.
- Storage diuji lewat byte sebenarnya, bukan hanya status image route. File
  hilang harus tetap dibedakan dari placeholder pada verifikasi migrasi.
- Auth/Cakupan, publikasi, upload, mutation, dan cache memakai E2E/smoke test
  existing pada permukaan pengguna. Test tidak menginspeksi state komponen.
- Quality gate existing—format, lint, structure, typecheck, unit, E2E, build,
  browser runtime, dan Next.js DevTools—tetap menjadi regression gate.

Prior art yang dipakai:

- CI dan deployment staging yang sudah mematok image berdasarkan commit;
- wizard refresh staging untuk dump/restore, journal reconciliation, asset
  transfer, ownership, dan byte verification;
- existing route-handler tests untuk kontrak HTTP;
- existing DB guard dan duplicate-preflight tests untuk operasi remote
  fail-closed;
- existing Playwright E2E untuk perilaku pengguna dan runtime browser;
- release gate production yang sudah mengunci authorization, session, audit,
  migration, query plan, dan compatibility.

Test yang baik hanya menyatakan keadaan masuk dan perilaku yang terlihat dari
luar. Ia tidak mengunci nama container hasil Dokploy, urutan fungsi internal,
layout panel, atau detail implementasi Traefik yang dapat berubah.

## Out of Scope

- Production CD atau deployment otomatis saat push ke `main`.
- Canary per-Struktur, rolling multi-replica, atau zero-downtime migration.
- Memindahkan project baru ke server/Swarm lain.
- Memakai PostgreSQL atau volume project lama sebagai runtime project baru.
- Logical replication, reverse replication, atau sinkronisasi balik write baru
  ke stack lama.
- Down migration atau rollback schema destruktif.
- Memindahkan, mematikan, atau menghapus RustFS dan `assets.kammi.id`.
- Mengembalikan S3 client/fallback ke aplikasi atau menulis ganda dari runtime.
- Menghapus Application, PostgreSQL, volume, image, backup, atau snapshot lama.
- Membangun read-only mode pada aplikasi utama; maintenance page mengambil
  seluruh trafik selama freeze.
- Redis, shared distributed cache, atau strategi multi-replica.
- Full metrics/telemetry stack; requirement berhenti pada health, uptime, log,
  dan alert minimum.
- Rotasi semua secret tanpa indikasi bocor atau jadwal rotasi.
- Penyamaran ulang data production di staging; kebijakan ADR staging tetap
  berlaku.
- Normalisasi, kompresi, atau penulisan ulang key gambar lama.
- Mengubah model domain Kader, Member, Akun, Struktur, Cakupan, Artikel, atau
  Situs Struktur.
- Membuat Struktur/Kader fiktif untuk smoke test.
- Menjalankan deployment production sebagai bagian implementasi agen tanpa
  otorisasi dan akses manusia pada setiap gate production.

## Further Notes

- Pekerjaan repo dan pekerjaan production harus dipisah menjadi tiket. Endpoint
  health, artefak maintenance, one-shot/preflight tooling, dan automated checks
  dapat dikerjakan agen. Provisioning, secret, backup, domain handoff, dan
  cutover membutuhkan operator berakses production.
- Current release image membawa migration tooling dan DB guard tetapi belum
  membawa duplicate-preflight script. Spec mengharuskan gap itu ditutup sebelum
  release freeze.
- Application production utama harus tetap tanpa auto-migration. Kebijakan
  migrasi manual production dari ADR 0008 tidak berubah.
- Cache gambar persisten dan volume upload bukan optimisasi opsional; keduanya
  bagian resource graph yang membuat ADR storage/cache berlaku setelah redeploy.
- Angka historis RustFS adalah 44 object dan 173,9 MB. Operator harus mengukur
  ulang count/bytes/hash saat preflight; angka lama bukan release proof.
- RPO nol berlaku pada cutover setelah write freeze. Kebijakan backup harian
  setelah production stabil mengikuti konfigurasi Dokploy/provider dan harus
  dibuktikan lewat restore drill.
- Status spec `ready-for-agent` berarti keputusan produk dan arsitektur sudah
  lengkap. Ia tidak memberi agen credential production atau izin melewati gate
  manusia.
