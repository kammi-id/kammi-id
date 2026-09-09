# Hapus Selamanya membalik ADR 0004, tapi hanya untuk Struktur yang terbukti tidak pernah dipakai

ADR 0004 melarang hard delete Struktur karena `organization.code` tersusun ke
dalam Nomor Induk Anggota, dan opsi "hard delete untuk Struktur kosong" sudah
dipertimbangkan di sana — **dan ditolak**. Alasan penolakannya spesifik: syarat
"nol Member" yang dipakai prasyarat penghapusan biasa (`checkDeletion`, spec §3)
menghitung Member **hidup** saja, sehingga sebuah Struktur bisa "nol Member"
sambil masih menggantung Member yang sudah di-soft-delete namun Nomor Induknya
sudah tercetak dari `code` itu. Hard delete di titik itu akan membebaskan
`code` yang sebenarnya masih terpakai.

Permukaan `/dashboard/branches/terhapus` (Struktur Terhapus) sekarang menambah
tombol **Hapus Selamanya**: menghapus baris `organization` dari basis data
sungguhan, sekali untuk selamanya, beserta seluruh Akun kepengurusan yang
terhubung ke Struktur itu (`user.connected_organization_id`).

## Decision

**Hapus Selamanya diizinkan, tapi hanya lewat gerbang yang menutup persis
lubang yang membuat ADR 0004 menolak opsi ini dulu.**

Prasyaratnya bukan `checkDeletion` biasa, melainkan `checkHardDeletion` — lebih
ketat di setiap sumbu:

1. **Nol Kader SELAMANYA, bukan nol Kader hidup.** Dihitung tanpa filter
   `deleted_at` sama sekali. Kalau Struktur ini pernah, sekalipun sekali, punya
   satu baris `member`, tombolnya nonaktif selamanya — tidak peduli Kader itu
   sudah lama di-soft-delete. Inilah tepatnya lubang yang ADR 0004 tunjuk.
2. **Nol Struktur anak dalam Keadaan apa pun, termasuk Terhapus.** Berbeda dari
   `checkDeletion` (spec §3 klausa 2), yang sengaja **tidak** menghitung anak
   Terhapus. Di sini anak Terhapus tetap menghitung, sebab alasannya bukan lagi
   soal kebijakan tapi soal fisik: baris anak apa pun, di Keadaan apa pun,
   `parent_id`-nya masih menunjuk baris yang mau dihapus, dan FK akan menolak.
3. **Nol Daurah, nol Publikasi (Artikel/Kategori/Pengaturan Situs) yang
   menggantung.** Konsekuensi teknis yang sama: keempatnya NOT NULL, NO ACTION
   ke `organization.id` sejak tiket 13. Membiarkannya menggantung berarti FK
   menolak dengan `23503` mentah; membereskannya diam-diam berarti mengulang
   persis kesalahan yang membuat cascade lama dicabut (lihat ADR 0004,
   consequences). Jadi diblokir dengan pesan, bukan salah satu dari dua itu.

Kalau ketiganya nol, `code` Struktur ini **tidak pernah** tersusun ke dalam
Nomor Induk siapa pun — bukan cuma "tidak sedang", tapi tidak pernah sejak
baris ini ada. Membebaskannya untuk dipungut ulang tidak membangkitkan risiko
ADR 0004: tidak ada Nomor Induk lama yang bisa jadi kembar, karena tidak pernah
ada Nomor Induk yang dicetak dari `code` ini sama sekali.

**Akun kepengurusan ikut terhapus, sengaja.** ADR 0004 mencabut cascade
`user.connected_organization_id` justru supaya `DELETE FROM organization`
**tidak bisa lagi** membawa Akun secara diam-diam lewat panggilan yang tak
disengaja. Jalur ini membawanya lewat panggilan yang **disengaja**, di dalam
transaksi yang sama, di belakang gerbang yang sama ketatnya dengan gerbang
`pulihkan` (`requireStrukturRestoreAccess` — Root dan BPW PP), dan gerbang
konfirmasi ketik-`code` yang sama dengan Hapus biasa. Bedanya bukan siapa yang
mengetuk pintu; bedanya adalah pintu ini sengaja dibuka, bukan terbuka sendiri.

## Considered Options

**Menghitung ulang syarat `checkDeletion` yang sudah ada** (nol Member hidup,
nol Daurah, anak Terhapus tidak dihitung) lalu menambahkan hard delete di
baliknya. Ditolak: itu persis opsi yang ADR 0004 sudah tolak, tanpa mengubah
apa pun tentang kenapa ia ditolak.

**Menghapus Kader dan Struktur anak yang menggantung sekaligus** (cascade
penuh) supaya tombolnya selalu bisa ditekan. Ditolak keras: itu membangkitkan
kembali persis bahaya yang membuat cascade lama dicabut — satu klik yang
menghapus data yang orang lain mungkin tidak sadar masih ada.

## Consequences

`code` Struktur yang berhasil dihapus selamanya menjadi bebas dipungut ulang
oleh Struktur baru — satu-satunya celah yang sengaja dibuka di aturan "`code`
terkunci selamanya" milik ADR 0004. Celah ini sempit dan terbukti aman:
terbukti sempit karena syaratnya menutup jalan `code` itu pernah sampai ke
Nomor Induk siapa pun.

Karena syaratnya seketat itu, tombol ini realistis hanya menyala untuk Struktur
yang benar-benar salah buat — belum pernah dipakai sama sekali. Itu memang
target penggunanya: bukan pengganti Hapus biasa, bukan jalan pintas untuk
"pensiun"-kan Struktur yang pernah berjalan.
