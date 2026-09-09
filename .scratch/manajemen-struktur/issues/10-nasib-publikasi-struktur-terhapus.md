# 10 — Nasib publikasi milik Struktur Terhapus

**Type:** grilling
**Status:** resolved
**Blocked by:** —

## Question

Naik dari kabut (`Not yet specified`) setelah tiket 01 menajamkan separuh
pertanyaannya.

Tiket 01 menetapkan Struktur Terhapus diperlakukan **seolah barisnya tidak
pernah ada**: slugnya 404, tidak muncul di mana pun, dan tidak ada permukaan
yang berkata "sudah dihapus". Untuk Non-Aktif, akibatnya sudah diputus di
charting — situs publiknya mati total, artikelnya ikut 404.

Yang belum diputus: **apa yang terjadi pada barisnya sendiri.** Syarat
penghapusan menjaga nol Struktur anak, nol Member, dan nol Daurah — tapi
**tidak** menyebut `article`, `article_category`, maupun `site_settings`. Jadi
sebuah Struktur bisa dihapus sambil menggantung Artikel dan Pengaturan Situs.

1. **Apakah publikasi ikut jadi syarat penghapusan?** Nol Artikel jadi syarat
   keempat, atau Artikel dibiarkan menggantung dan ikut lenyap dari pembacaan
   bersama induknya? Perhatikan bahwa "Terhapus = tercatat keliru" (tiket 01)
   mendukung syarat keempat: Struktur yang sempat menerbitkan Artikel susah
   disebut salah catat. Tapi Artikel bisa jadi lebih murah dibuang daripada
   Daurah.

2. **Kalau menggantung, siapa yang menyembunyikannya?** Artikel dibaca lewat
   jalurnya sendiri, bukan lewat Struktur. Prinsip "seolah tidak ada" menuntut
   Artikel milik Struktur Terhapus juga 404 — dan itu berarti tiap pembacaan
   Artikel harus ikut memeriksa Keadaan Struktur pemiliknya.

3. **`onDelete: 'cascade'` yang sekarang jadi hiasan.** `article`,
   `article_category`, `site_settings`, dan `user` semuanya memasang
   `onDelete: 'cascade'` ke `organization`. ADR 0004 memastikan cascade itu
   **tidak akan pernah menyala** — tidak ada lagi jalur yang menghapus baris
   `organization`. Putuskan: dibiarkan (tidak berbahaya, tapi menyesatkan
   pembaca skema), dicabut, atau dibiarkan dengan komentar. Jangan biarkan
   orang membacanya sebagai jaminan bahwa data ikutan terbereskan sendiri.

**Bukan urusan tiket ini.** Nasib **Akun** milik Struktur Terhapus dipegang
tiket 05. `code`/`slug` dipegang tiket 03.

## Answer

### 1. Tidak ada syarat keempat — dan skema sudah mengatakannya

`article`, `article_category`, dan `site_settings` **tidak** menjadi prasyarat
penghapusan.

Alasannya bukan selera. Periksa siapa yang memasang `onDelete: 'cascade'` ke
`organization`:

| Bercascade | Tanpa cascade |
| --- | --- |
| `article.organization_id` | `organization.parent_id` |
| `article_category.organization_id` | `member.organization_id` |
| `site_settings.organization_id` | `training.organization_id` |
| `user.connected_organization_id` | |

Kolom **tanpa** cascade persis sama dengan daftar prasyarat penghapusan — anak,
Member, Daurah. Penulis skema aslinya sudah mengklasifikasi: **cascade = ikut
mati, tanpa cascade = wajib kosong lebih dulu.** Menjadikan Artikel prasyarat
keempat berarti memindahkannya menyeberang klasifikasi itu tanpa alasan baru.

Argumen tandingannya nyata dan sudah ditimbang: "Terhapus = tercatat keliru"
(tiket 01), dan Struktur yang sempat menerbitkan Artikel susah disebut salah
catat. Yang mengalahkannya adalah skenario yang paling sering terjadi —
**Struktur salah buat yang sempat dicoba dengan satu draft artikel akan jadi tak
bisa dihapus selamanya**, dan `code` yang beku (ADR 0004) membuatnya nyangkut
permanen. Aksi hapus dibuat justru untuk kasus itu; syarat keempat akan
menutupnya.

`member_organization_history.organization` **bukan** FK — ia kolom teks
(`organization-history.sql.ts:17`), jadi ia di luar percakapan ini seluruhnya.

### 2. Cascade dicabut — ADR 0004 naik dari konvensi jadi jaminan skema

Keempat cascade itu **dicabut**, dan fungsi `deleteOrganization`
(`db/query/organization.ts:325`, masih `db.delete`, nol call-site) **dihapus**.

Ini bukan sekadar merapikan skema yang menyesatkan. Hari ini `DELETE FROM
organization` berhasil diam-diam dan **membawa serta Akun penggunanya** — sebuah
pemanggilan `deleteOrganization` yang tak sengaja adalah kehilangan senyap, bukan
galat. Setelah cascade dicabut, perintah yang sama gagal dengan `23503
foreign_key_violation` dan nol baris berubah.

Hasilnya: **larangan hard delete berhenti dijaga ingatan manusia dan mulai
dijaga basis data.** ADR 0004 jadi benar secara struktural, bukan secara
disiplin. Itu imbalan yang jauh lebih besar daripada ongkos satu `ALTER TABLE`
yang toh sudah ikut rombongan migrasi peta ini.

### 3. Invarian menyeluruh di lapisan baca, bukan tambalan per-tabel

**Tiap pembacaan atas tabel yang mereferensi `organization` wajib menyaring
Struktur Terhapus. Struktur Non-Aktif TIDAK disaring.**

Asimetri itu inti aturannya: Non-Aktif tetap terlihat dari dalam dasbor beserta
isinya (`CONTEXT.md`, dan keputusan penelusuran tiket 08 bergantung padanya),
sementara Terhapus diperlakukan seolah barisnya tidak pernah ada (tiket 01).

Tujuh referensi yang tunduk padanya:

| Referensi | Catatan |
| --- | --- |
| `organization.parent_id` | Terhapus tidak boleh muncul sebagai anak |
| `member.organization_id` | lihat koreksi di bawah |
| `training.organization_id` | hampa oleh prasyarat, tetap disaring demi keseragaman |
| `article.organization_id` | pembacanya belum ada — lihat bagian 4 |
| `article_category.organization_id` | idem |
| `site_settings.organization_id` | idem |
| `user.connected_organization_id` | **pengecualian**, lihat bawah |

**`user` adalah pengecualian yang disengaja.** Keadaan Akun sudah dijaga tiket 05
di `readActiveSession`/`validateSession`, bukan oleh filter baca. Menyaring
Terhapus dari pembacaan `user` justru akan menyembunyikan baris Akun dari
permukaan administratif yang perlu melihatnya. Gerbangnya di sesi; jangan
tambahkan yang kedua di lapisan baca.

Aturan ini ditetapkan **sebagai aturan, bukan sebagai temuan**, karena tiket 08
sudah membuktikan bentuk ini gampang kelewat — dan bagian 4 menunjukkan pembaca
yang belum lahir akan mewarisinya tanpa harus menemukannya ulang.

### 4. Temuan: situs publik per-Struktur belum ada sama sekali

Ketetapan charting berbunyi "Struktur Non-Aktif → situs publiknya mati **total**,
artikelnya ikut 404". Diperiksa, dan permukaan itu **belum dibangun**:

- `(main)` di-hardwire ke PP lewat `resolvePPOrgId` →
  `readOrganizationIdByType('pp')` (`(main)/_data/site-settings.ts`).
- `proxy.ts` hanya `matcher: '/dashboard/:path*'` — nol perutean per-tenant, nol
  subdomain, nol slug Struktur di rute publik.
- `/berita` masih **stub**: "Belum ada konten." (`(main)/berita/page.tsx:30`).
  Nol pembacaan Artikel di seluruh sisi publik.

Jadi **nol Artikel milik siapa pun terbaca publik hari ini**, dan satu-satunya
Struktur yang punya situs publik adalah PP — yang tiket 05 sudah pastikan **tidak
bisa dinonaktifkan oleh siapa pun**.

Konsekuensinya untuk peta ini: klausa "artikelnya ikut 404" **tetap berdiri
sebagai invarian**, tapi ia invarian untuk permukaan yang belum ada, dan bagian 3
sudah membuatnya diwarisi otomatis. Tidak ada yang perlu dirancang di sini, dan
membangun situs publik per-Struktur **di luar cakupan** peta ini.

### 5. Koreksi terhadap jawaban tiket 08

Tiket 08 menyatakan kedua CTE Kader akan "menyedot Kader milik Struktur Terhapus"
begitu `deleted_at` mendarat. **Diperiksa lebih teliti di sini, dan itu benar
hanya untuk salah satunya.**

- **`readDescendantMembers` — tidak bocor.** Ia menyaring `m.deleted_at IS NULL`
  (`member.ts:523`), dan prasyarat penghapusan menjamin Struktur Terhapus punya
  **nol Member hidup**. Id-nya memang masuk ke `org_tree`, tapi ia tidak
  menghasilkan satu baris pun.
- **`readMemberAggregates` — bocor betulan.** Ia memancarkan **satu baris per
  organisasi di subtree**, dikunci `organizationId` (`member.ts:145-147`),
  terlepas dari berapa Member yang menempel. Jadi Struktur Terhapus muncul
  sebagai entri berhitungan nol — sebuah Struktur yang seharusnya tak terlihat,
  hadir di daftar.

Bocornya nyata, tapi letaknya di fungsi yang lain dan sebabnya lain: bukan Kader
yang tersedot, melainkan **barisnya sendiri yang muncul**. Tambalan yang
dipasang di tempat yang salah tidak akan menutup apa pun.
