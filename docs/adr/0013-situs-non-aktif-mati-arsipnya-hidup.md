# Situs Struktur Non-Aktif mati, arsipnya tetap hidup

`CONTEXT.md` sudah menetapkan bahwa Situs Struktur milik **Struktur Non-Aktif**
berhenti melayani. Yang belum ditetapkan adalah sejauh mana. Kami memutuskan
garisnya jatuh antara **situs** dan **arsip**: beranda, daftar Berita, Halaman,
dan seluruh navigasi Struktur itu menjadi tidak ditemukan, sementara
**Permalink** setiap **Berita** yang telanjur **Terbit** tetap melayani, dan
Berita itu tetap muncul di **Berita Jaringan**.

Karena halaman Berita tetap hidup di situs yang berandanya sudah mati, halaman
itu dirender dengan kerangka minimal: identitas Struktur tanpa satu pun tautan
navigasi, ditambah keterangan bahwa kepengurusan ini sedang tidak berjalan dan
tautan ke `kammi.id`.

Struktur Terhapus tidak ikut aturan ini. Ia diperlakukan seolah barisnya tidak
pernah ada, Berita-nya termasuk.

## Considered Options

**Halaman nisan ber-HTTP 200** — beranda tetap dilayani, isinya keterangan
bahwa kepengurusan sedang tidak berjalan — sempat menjadi usulan, dengan alasan
404 itu berbohong: Strukturnya ada, hanya tidak berjalan. Opsi itu ditolak
karena ia membuat Struktur Non-Aktif tetap memiliki permukaan publik yang bisa
ditemukan, diindeks, dan ditautkan. "Berhenti melayani" lalu berarti "melayani
sesuatu yang lain", dan perbedaannya lenyap dari sudut pandang mesin pencari.

**Mematikan seluruhnya, Permalink termasuk**, adalah opsi yang paling konsisten
secara mekanis dan paling merusak secara domain. Berita yang pernah terbit sudah
tersebar di percakapan, kutipan, dan tautan pihak lain; mematikannya berarti
kepengurusan yang berhenti menghapus jejak yang pernah sah. Keadaan Struktur
menyangkut kepengurusan, bukan pembatalan sejarahnya — dan menyembunyikan arsip
justru merugikan Struktur yang suatu saat aktif kembali.

**Menghapus Berita Struktur Non-Aktif dari Berita Jaringan** dipertimbangkan
demi menghindari tautan menuju situs yang setengah mati. Ditolak dengan alasan
yang sama: Berita Jaringan justru satu-satunya jalan agar arsip itu masih bisa
ditemukan setelah berandanya hilang.

## Consequences

Sebuah Struktur Non-Aktif menghasilkan campuran yang tampak tidak konsisten bila
dilihat sepotong: `<slug>.kammi.id` menjawab 404, sementara
`<slug>.kammi.id/berita/2026/01/<slug>` menjawab 200. Itu disengaja. Siapa pun
yang "membetulkan" ketidaksesuaian ini dengan menyeragamkan salah satu sisi
sedang membatalkan keputusan ini.

Kerangka minimal pada halaman Berita bukan hiasan, melainkan syarat. Tanpa itu,
navbar dan footer halaman tersebut menawarkan tautan ke beranda yang 404 —
pembaca dikirim dari halaman yang hidup ke halaman yang mati oleh situs itu
sendiri.

Penyaringan di jalur baca menjadi **berbeda antar permukaan**, dan perbedaan
itu wajib dijaga: daftar milik Situs Struktur menyaring Keadaan Non-Aktif,
sedangkan Berita Jaringan tidak — ia hanya menyaring Terhapus dan Situs yang
belum aktif. Menyalin klausa penyaringan dari satu permukaan ke permukaan lain
adalah cara paling mudah untuk melanggar ADR ini tanpa sadar.

Menonaktifkan sebuah Struktur mengubah apa yang dilayani publik. Karena itu
perubahan Keadaan Struktur ikut membatalkan cache permukaan publik, termasuk
Berita Jaringan — bukan hanya cache dasbor. Pemicunya adalah perubahan Keadaan,
bukan perubahan Artikel, dan itu jenis pemicu yang paling gampang terlewat.
