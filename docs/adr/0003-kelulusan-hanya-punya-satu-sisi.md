# Kelulusan hanya punya satu sisi

`CONTEXT.md` sebelumnya mendefinisikan Kelulusan sebagai "keputusan lulus atau
tidaknya" seorang Peserta, seolah "dinilai tidak lulus" adalah sebuah keputusan
yang tersimpan. Datanya tidak pernah bisa menyimpannya: Kelulusan direkam
sebagai satu boolean yang selalu terisi, dan UI-nya sebuah kotak centang dua
keadaan. Kami memutuskan mengikuti data, bukan mengubahnya — **Kelulusan adalah
penetapan bahwa Peserta lulus, dan ketiadaannya tidak membedakan antara belum
dinilai dan dinilai tidak lulus.**

## Considered Options

Alternatifnya adalah menjadikan kolomnya nullable, sehingga "belum dinilai",
"lulus", dan "tidak lulus" jadi tiga keadaan sungguhan. Itu bentuk yang lebih
jujur terhadap kenyataan bahwa Daurah memang meluluskan sebagian dan tidak
meluluskan sebagian. Opsi itu dibatalkan karena dua hal. Pertama, ia migrasi di
database production. Kedua — dan ini yang menentukan — migrasi itu tidak bisa
memulihkan apa pun: setiap baris yang sekarang bernilai "tidak lulus" tidak
menyimpan jejak apakah ia pernah dinilai, jadi tidak ada cara memutuskan mana
yang seharusnya menjadi "belum dinilai". Menambah keadaan ketiga hanya akan
memberi ketepatan semu pada data yang tidak pernah merekamnya.

Konsekuensinya diterima sadar: keputusan "tidak lulus" seorang Master of
Training tidak tercatat sebagai keputusan, dan tidak akan bisa direkonstruksi
dari data yang sudah terkumpul.

## Consequences

Masa Penetapan Kelulusan hanya menjaga Peserta yang **memegang** Kelulusan.
Mengeluarkan Peserta yang tidak memegangnya adalah koreksi roster dan sah kapan
pun, meski Daurahnya sudah lama selesai — termasuk Peserta yang secara nyata
pernah dinilai tidak lulus, karena penilaian itu memang tidak berbekas.

Jangan "membetulkan" kotak centang Kelulusan menjadi tiga keadaan tanpa
membatalkan keputusan ini lebih dulu. Menyalakan keadaan ketiga di UI tanpa
menyentuh skema akan melahirkan keadaan yang tidak bisa disimpan; menyentuh
skema tanpa menyentuh ADR ini akan menghidupkan kembali masalah pemulihan data
di atas.
