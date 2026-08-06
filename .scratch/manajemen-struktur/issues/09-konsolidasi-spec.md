# 09 — Konsolidasi jadi spec siap-serah

**Type:** task
**Status:** open
**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 10, 11, 12

## Question

Menyatukan seluruh jawaban tiket jadi satu `.scratch/manajemen-struktur/spec.md`
yang bisa dipecah jadi tiket implementasi tanpa perlu membaca peta ini lagi.

Isinya minimal:

- Model keadaan Struktur dan istilah kanoniknya (dari 01)
- Matriks kewenangan lengkap, dalam bentuk yang bisa langsung jadi daftar
  kasus tes (dari 02). **Rakit versi yang sudah diamandemen tiket 12**, bukan
  versi asli: BPW PP × `pulihkan` bukan lagi `—`, dan gate `pulihkan` bukan lagi
  `role === 'root'` saja. Gate-nya **bukan** `role === 'bpw'` — yang lolos hanya
  BPW yang Struktur terhubungnya **PP**.
- **Prasyarat penghapusan berbunyi lengkap** (dari 12): "nol anak, nol Member,
  nol Daurah", dengan **anak Non-Aktif menghitung** (tiket 06) dan **anak
  Terhapus tidak menghitung** (tiket 12). Tulis dua klausa itu apa adanya —
  keduanya diputus di tiket berbeda dan gampang hilang saat dirakit.
- Bentuk skema: kolom baru, constraint, dan urutan migrasi yang aman untuk
  basis data produksi (dari 01, 03, 04, 05). **Entri kabut "Migrasi produksi"
  sudah lulus ke sini** — isinya tidak lagi kabur, tinggal dirakit. Yang sudah
  tetap dan tidak boleh dilanggar saat merakitnya:
  - `is_non_active` **tidak disentuh**; `deleted_at` ditambahkan (tiket 01).
  - Keadaan Struktur itu kolom `generatedAlwaysAs` — **tanpa backfill**, tapi
    `drizzle-kit` membuang `NOT NULL` dari kolom generated yang ditambah lewat
    `ALTER TABLE`, jadi `SET NOT NULL` harus ditulis tangan (tiket 03).
  - **Tidak ada `CONCURRENTLY`** — runner Drizzle membungkus seluruh migrasi
    dalam satu transaksi, dan `CREATE INDEX CONCURRENTLY` di dalamnya
    me-rollback semuanya (tiket 03).
  - `code` unik lintas semua baris; `slug` partial unique
    `WHERE deleted_at IS NULL`; `code_slug` **tanpa** constraint (tiket 03).
  - **Nol kolom baru di `user`** — Keadaan Akun turunan, bukan tersimpan
    (tiket 05).
  - ~~**Tiket 04 penghalang keras**: migrasi constraint tidak boleh ditulis
    sebelum data duplikat diperiksa.~~ **Diamandemen oleh tiket 04.** Akses
    produksi tidak pernah diberikan, jadi pemeriksaannya pindah dari momen
    perencanaan ke **momen migrasi**. Migrasinya boleh ditulis sekarang; yang
    haram adalah menjalankannya tanpa pra-terbang. Spec wajib membawa tiga hal
    dari 04: (a) **dua migrasi terpisah** — `slug` dan `code` tidak boleh
    disatukan, sebab `code` duplikat menuntut putusan manusia sementara `slug`
    duplikat perbaikannya mekanis; (b) **pra-terbang wajib** —
    `check-duplicates.ts` dipindahkan ke `src/scripts/` dengan skrip
    `package.json`-nya sendiri; (c) **pohon keputusan** per hasil pra-terbang,
    disalin apa adanya dari jawaban 04.
- Aturan sinkronisasi keadaan Akun dan bagaimana drift-nya ketahuan (dari 05)
- Aturan pemindahan induk sebagai **aksi berdiri sendiri** — hanya BPW PP dan
  Root, nol sel baru di matriks (dari 06). Termasuk aturan cermin: menghidupkan
  anak menuntut induknya hidup lebih dulu. **Batas calon induknya ditulis dalam
  rumusan tiket 11, bukan rumusan asli tiket 06**: calon sah bila **`pwCode`
  hasil penurunan NIA tidak berubah** — bukan "dalam PW yang sama", yang tidak
  terdefinisi untuk PK di bawah PDLN dan meloloskan penyeberangan PDLN → PW.
- **Perubahan penurunan NIA** (dari 06): untuk PK, coba kode induk dulu lalu
  mundur ke kode sendiri. **Wajib menyentuh dua tempat** — `lib/utils/member.ts`
  dan salinannya di `kader/_components/bulk-upload/action.ts:110-145`. Yang
  menyentuh satu saja melahirkan dua sistem penomoran.
- Empat permukaan beserta keputusan desainnya (dari 07, 08, 11, 12)
- **Invarian lapisan baca** (dari 10, menggantikan rumusan sempit tiket 08).
  Tiap pembacaan atas **ketujuh** referensi ke `organization` menyaring Struktur
  **Terhapus** dan **tidak** menyaring **Non-Aktif** — asimetri itu wajib
  dipertahankan, sebab keputusan penelusuran tiket 08 bergantung padanya.
  `user.connected_organization_id` **dikecualikan**: gerbangnya sudah di sesi
  (tiket 05), jangan tambah yang kedua. Kasus konkret yang sudah ketahuan bocor:
  **`readMemberAggregates`** (`member.ts:145-147`) memancarkan satu baris per
  organisasi di subtree, jadi Struktur Terhapus muncul sebagai entri berhitungan
  nol. `readDescendantMembers` **tidak** bocor (`m.deleted_at IS NULL` +
  prasyarat nol Member hidup) — jangan tambal di sana.
- **Cascade dicabut, `deleteOrganization` dihapus** (dari 10). Keempat
  `onDelete: 'cascade'` ke `organization` (`article`, `article_category`,
  `site_settings`, `user`) dicabut, dan fungsi `deleteOrganization`
  (`organization.ts:325`) dihapus. Setelah ini `DELETE FROM organization` gagal
  dengan `23503` alih-alih berhasil senyap sambil membawa Akun — **ADR 0004 jadi
  dijamin skema, bukan dijaga ingatan.** Ikut rombongan migrasi yang sama.
- **Publikasi bukan prasyarat penghapusan** (dari 10). Artikel, Kategori, dan
  Pengaturan Situs boleh menggantung; yang menahan penghapusan tetap tiga —
  anak, Member, Daurah.
- Nasib publikasi milik Struktur Terhapus dan Non-Aktif (dari 10)

Lalu pecah jadi tiket implementasi di `.scratch/manajemen-struktur/issues/`,
melanjutkan penomoran. ~~Urutkan supaya **penambalan celah Cakupan di
`add-form/action.ts` jadi yang pertama**~~ — **sudah ditambal di luar peta**
(commit `a9c535b`), jadi ia tidak perlu tiket sendiri lagi.

Yang menggantikannya sebagai catatan urutan: tambalan itu **sengaja sempit**
(Cakupan, Jenjang, pembekuan `type`/`parentId`) dan meninggalkan dua gerbang
sempit di `src/lib/auth/kestrukturan.ts`. Tiket implementasi matriks tiket 02
harus **menggantikan** keduanya dengan `canManageKestrukturan` beserta dua gate
async-nya — bukan menambahkan lapis ketiga di sebelahnya. Tes
`kestrukturan.test.ts` yang sudah ada ikut dirombak bersamanya, dan ia sekaligus
memberi jawaban pertama untuk kabut **bentuk tes**: pola seam
`kekaderan.test.ts` terbukti jalan untuk permukaan ini.

Sesi ini **tidak menulis kode aplikasi**. Kalau muncul dorongan untuk mulai
membangun, itu tandanya peta sudah selesai dan pekerjaannya berpindah tangan.

Sebelum menutup: periksa **Not yet specified** di `map.md`. Kabut yang masih
tersisa di sana saat tiket ini dikerjakan harus salah satu dari tiga —
sudah terjawab diam-diam oleh tiket lain (pindahkan ke spec), masih kabur
(katakan terang di spec bahwa implementasi akan menabraknya), atau ternyata di
luar cakupan (pindahkan ke **Out of scope**). Jangan tinggalkan menggantung.
