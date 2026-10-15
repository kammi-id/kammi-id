# Berita Jaringan menjadi Berita KAMMI se-Indonesia

Istilah domain **Berita Jaringan** pensiun dan digantikan **Berita KAMMI
se-Indonesia**. Alamat arsipnya pindah dari `/berita/jaringan` ke
`/berita/seindonesia`, dan alamat lama tetap hidup sebagai **pengalihan
permanen** yang tidak pernah dicabut.

Rename berhenti di dua tempat: **glosarium** dan **apa yang dibaca pembaca**.
Nama berkas komponen, nama fungsi query, cache tag `'berita-jaringan'`, dan
index basis data `article_terbit_jaringan_idx` tetap memakai nama lama. Prosa
ADR 0012 dan ADR 0013 juga tidak ditulis ulang.

## Considered Options

**Rename total sampai ke identifier dan index basis data** adalah bentuk yang
paling konsisten dibaca, dan itu daya tariknya: seorang pembaca baru tidak
pernah bertemu dua nama untuk satu benda. Ditolak karena harganya nyata dan
manfaatnya kosmetik. Mengganti nama index menuntut satu migrasi tambahan pada
basis data production yang tidak mengubah satu pun perilaku; mengganti cache
tag menyentuh enam berkas action yang bertugas menjaga kebenaran invalidasi,
dan salah satu bentuk gagalnya senyap — cache yang tidak pernah ter-invalidate
tidak melempar apa pun, ia sekadar menyajikan yang basi.

**Menulis ulang ADR 0012 dan 0013 agar memakai nama baru** ditolak lebih cepat.
ADR adalah catatan bertanggal tentang keputusan yang pernah diambil beserta
keadaan saat itu. Menyuntingnya agar terlihat konsisten dengan hari ini
menghapus justru hal yang membuatnya berharga. Cara benar mencatat sebuah
rename adalah ADR baru yang menunjuk ke belakang — berkas ini.

**Membiarkan alamat lama melayani isinya sendiri** (dua alamat, satu isi)
adalah opsi termurah dan ditolak karena mesin pencari membacanya sebagai
konten duplikat — persis alasan yang sama yang sudah dipakai ADR 0014 untuk
menolak tahun-bulan kosmetik.

**Mempertahankan `/berita/jaringan` dan hanya mengganti label** adalah opsi
yang paling aman dan sempat menjadi rekomendasi. Ditolak oleh pemilik produk:
bila istilah domainnya berganti, alamatnya ikut, dan biaya redirect permanen
sudah diterima sadar.

## Consequences

**Dua nama hidup berdampingan di dalam kode, selamanya.** Siapa pun yang
mencari "Berita KAMMI se-Indonesia" di dalam `src/` akan menemukan lebih
sedikit dari yang ia harapkan; yang dicari bernama `berita-jaringan-section`,
`listBeritaJaringan`, dan `beritaJaringanPageHref`. `CONTEXT.md` menyebutkan
nama lama secara eksplisit supaya pencarian dari arah mana pun bertemu
jembatannya, dan komponennya membawa komentar yang menunjuk ke ADR ini.

**Pengalihan `/berita/jaringan` adalah utang permanen, bukan sementara.**
Alamat itu sudah pernah masuk `sitemap.xml` dan sudah pernah dibagikan.
Menghapus rute pengalihnya kelak — karena terlihat seperti sisa yang bisa
dibersihkan — akan mematikan tautan yang masih dipakai orang. Rute itu ada
tesnya, dan tesnya menyebutkan alasan ini.

**`?page=` ikut dibawa pengalihan.** Tanpa itu, setiap tautan halaman dalam
dari hasil pencarian mendarat di halaman satu. Bentuk gagalnya senyap: tidak
ada yang error, pembaca sekadar tidak menemukan yang ia klik.

**`sitemap.xml` hanya memuat alamat baru.** Sitemap yang memuat keduanya
menyuarakan duplikat yang justru sedang dihindari.
