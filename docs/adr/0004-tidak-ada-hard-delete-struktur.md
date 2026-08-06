# Struktur tidak pernah dihapus betulan, dan `code`-nya dikunci selamanya

Menghapus sebuah Struktur tidak pernah mengeluarkan barisnya dari basis data.
Penghapusan hanya menandai baris itu sebagai **Struktur Terhapus**, dan barisnya
tinggal di sana selamanya. Bersamaan dengan itu, `organization.code` tidak bisa
diubah setelah Struktur dibuat — bukan oleh BPW, bukan oleh BPH atas Strukturnya
sendiri, tidak oleh siapa pun kecuali lewat perbaikan data yang disengaja.

Dua keputusan ini satu paket karena sebabnya satu: `code` ikut tersusun ke dalam
**Nomor Induk Anggota**, yang menurut glosarium adalah identitas permanen
seorang Kader dan sekaligus identitas loginnya. Begitu `code` bisa berpindah
tangan — entah karena Struktur lamanya lenyap dari basis data lalu `code`-nya
dipungut Struktur baru, entah karena seseorang menyunting `code` sebuah Struktur
yang sudah punya Kader — dua Kader bisa berakhir memegang Nomor Induk yang sama.
Nomor Induk yang kembar bukan cuma data kotor; ia dua orang yang login sebagai
satu orang.

## Considered Options

Alternatif yang serius adalah **hard delete khusus Struktur kosong**. Syarat
penghapusan sudah mengharuskan nol Struktur anak, nol Member, dan nol Daurah,
jadi sepintas tidak ada yang bisa rusak: Struktur yang belum pernah punya Member
belum pernah menerbitkan Nomor Induk apa pun, dan `code`-nya aman dipungut
ulang.

Opsi itu dibatalkan karena "nol Member" tidak berarti "tidak pernah punya
Member". Member sendiri dihapus secara lunak (`member.deleted_at`), sehingga
sebuah Struktur bisa memenuhi syarat "nol Member" sambil masih menggantung
Member terhapus yang Nomor Induknya sudah tercetak dari `code` itu. Hard delete
akan membebaskan `code` yang sebenarnya masih terpakai, dan tidak ada cara
menemukan kembali pemilik aslinya setelah barisnya hilang.

Menaikkan syaratnya jadi "nol Member termasuk yang terhapus" sempat
dipertimbangkan dan ditolak: itu memperumit syarat penghapusan demi
menyelamatkan sebuah optimasi yang tidak dibutuhkan siapa pun. Tidak ada yang
menuntut barisnya benar-benar hilang.

## Consequences

Sekali sebuah Struktur dibuat, `code`-nya menjadi milik pohon nasional
selamanya, bahkan setelah Strukturnya dihapus. Salah ketik `code` saat pembuatan
tidak bisa dibetulkan lewat penyuntingan — jalannya adalah menghapus Struktur
itu dan membuat yang baru, dan `code` yang salah itu tetap terpakai selamanya.
Ini disengaja. Jangan menambahkan `code` ke daftar kolom yang boleh disunting
"karena cuma salah ketik".

`slug` berdiri di sisi yang berlawanan dan bebas diubah kapan saja, karena ia
cuma URL dan tidak pernah masuk ke Nomor Induk. Jangan menyamakan perlakuan
keduanya demi konsistensi.

`onDelete: 'cascade'` yang terpasang di `user.connected_organization_id` dan di
tabel-tabel publikasi tidak akan pernah menyala, karena tidak ada lagi jalur
yang menghapus baris `organization`. Membiarkannya di skema tidak berbahaya,
tapi jangan membacanya sebagai jaminan bahwa data ikutan akan terbereskan
sendiri — pembereskannya sekarang tugas jalur penghapusan, bukan tugas basis
data.
