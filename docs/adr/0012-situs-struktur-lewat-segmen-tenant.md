# Situs Struktur lewat segmen tenant, bukan root param

Setiap Struktur berhak atas **Situs Struktur** di subdomainnya sendiri
(`<slug>.kammi.id`), dan PP menempati apex `kammi.id`. Kami memutuskan seluruh
permukaan publik hidup di bawah **satu segmen dinamis biasa** — sebuah proxy
membaca `Host`, mengenali Struktur dari slug-nya, lalu me-rewrite **seluruh
path** ke bawah segmen itu. Pembaca data publik menerima identitas Struktur
sebagai **argumen**, sama seperti pembaca yang sudah ada di dasbor.

PP tidak dikecualikan. Apex ikut di-rewrite dan PP menjadi tenant biasa; yang
khas PP — peta jaringan dan **Berita Jaringan** — dikondisikan pada Jenjangnya,
bukan pada jalur routing yang berbeda.

## Considered Options

Bentuk yang lebih rapi adalah **root parameter** (`next/root-params`). Segmen
tenant diletakkan sebelum root layout, dan getter-nya bisa dipanggil dari Server
Component mana pun tanpa dioper — Next.js pun memasukkannya ke cache key secara
otomatis, sehingga tiap Struktur mendapat partisi cache-nya sendiri tanpa kami
merakitnya. Untuk repo yang sudah menyalakan `cacheComponents`, itu terdengar
seperti jawaban yang dirancang untuk kasus ini.

Opsi itu dibatalkan karena harganya adalah **root layout ganda**. Root parameter
wajib berada sebelum root layout, sementara repo ini punya satu root layout
tunggal di `src/app/layout.tsx` yang dipakai bersama oleh situs publik **dan**
dasbor: font, `globals.css`, `metadataBase`, dan JSON-LD. Memindahkannya ke
dalam segmen tenant memaksa dasbor menumbuhkan root layout-nya sendiri, dan
`<html>`, `<body>`, serta pemuatan font hidup di dua tempat yang harus dijaga
sinkron selamanya.

Yang menentukan bukan itu saja, melainkan preseden yang sudah menang di repo
ini: pembaca Pengaturan Situs di dasbor
(`dashboard/pages/home/_data/settings.ts`) **sudah** menerima `organizationId`
sebagai argumen dan sudah menandai cache-nya per-Struktur. Yang ganjil justru
pembaca di situs publik, yang mematok PP di dalam dirinya sendiri. Dengan
preseden itu, "mengoper identitas Struktur" bukan pola asing yang kami impor —
ia pola yang tinggal disamakan, dan kebebasan dari prop-drilling tidak sepadan
dengan root layout ganda.

**Mengecualikan apex** juga dipertimbangkan dan ditolak. Membiarkan `kammi.id`
tetap dilayani rute lama terasa aman karena tidak menyentuh yang sudah jalan,
tetapi ia melahirkan dua implementasi beranda yang harus dijaga sinkron, dan
memaksa setiap permukaan lintas-Struktur — Berita Jaringan, sitemap, RSS —
menyimpan cabang "kalau PP". Setiap fitur berikutnya ditulis dua kali.

## Consequences

**PP wajib punya Situs Aktif sejak migrasi, bukan disetel manual sesudahnya.**
Karena apex diperlakukan sebagai tenant, `kammi.id` mati begitu deploy kalau
penandanya belum menyala. Ini konsekuensi paling berbahaya dari keseragaman, dan
satu-satunya yang tidak akan terlihat di lingkungan pengembangan.

Alamat hasil rewrite **bisa diketik langsung**. Tanpa penjagaan, path internal
yang membawa slug Struktur akan melayani 200 dan menjadi duplicate content di
mata mesin pencari. Proxy wajib menolak request yang datang dari luar dengan
path internal itu; penjagaan ini hidup di proxy, bukan di tiap halaman.

Proxy harus mengecualikan aset. Selain `_next` dan berkas berekstensi, jalur
gambar `/api/images/` wajib ikut dikecualikan — kalau tidak, gambar di setiap
subdomain ikut ter-rewrite dan mati, dan gejalanya muncul jauh dari
penyebabnya.

Contoh resmi yang menjadi rujukan (`vercel/platforms`) hanya me-rewrite path
akar; path lain dibiarkan jatuh ke rute domain utama. Menyalinnya apa adanya
berarti `<slug>.kammi.id/berita` menampilkan berita PP. Kami me-rewrite seluruh
path, dan siapa pun yang membandingkan implementasi ini dengan contoh itu perlu
tahu perbedaan itu disengaja.

Kompensasi atas hilangnya cache key otomatis: penandaan cache per-Struktur
menjadi tanggung jawab penulis kode, bukan kerangka kerja. Tag yang tidak
menyebut Struktur akan terlihat benar dalam pengujian satu tenant dan baru
gagal di produksi, saat satu Komisariat menerbitkan Berita dan situs nasional
ikut kedaluwarsa.
