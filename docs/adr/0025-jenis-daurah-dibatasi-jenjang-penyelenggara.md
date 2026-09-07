# Jenis Daurah yang boleh digelar dibatasi Jenjang penyelenggaranya

`CONTEXT.md` sudah menyatakan bahwa jenis Daurah bergantung pada Jenjang
Struktur penyelenggaranya, tetapi tidak ada satu baris kode pun yang
menegakkannya. `createTrainingAction` menerima kombinasi apa pun, sehingga
sebuah Komisariat bisa mencatat dirinya menyelenggarakan DM3.

## Decision

| Jenjang   | DM1 | DM2 | DM3 | DPMK | TFI | Lainnya |
| --------- | --- | --- | --- | ---- | --- | ------- |
| PP        | ✓   | ✓   | ✓   | ✓    | ✓   | ✓       |
| PW        | ✓   | ✓   | ✓   | ✓    | ✓   | ✓       |
| PD / PDLN | ✓   | ✓   | —   | ✓    | ✓   | ✓       |
| PK        | ✓   | —   | —   | —    | —   | ✓       |

Tanda ✓ berarti **boleh**, bukan berarti lazim. DM3 umumnya digelar di
tingkat Wilayah dan DM2 di tingkat Daerah, tetapi kelaziman itu tidak ikut
dikodekan — PP tidak kehilangan hak apa pun, dan PW yang menggelar DM1 tidak
melanggar apa-apa.

Yang benar-benar dikunci adalah tiga larangan: **PD dan PDLN tidak menggelar
DM3**, dan **PK hanya menggelar DM1** di luar kategori Lainnya. Jenjang paling
bawah tidak menyelenggarakan Daurah yang menaikkan Kader melewati AB1, dan
tidak mencetak Perangkat.

Aturannya berlaku pada **perbuatan baru saja**: pembuatan Daurah dan
penggantian jenisnya. Daurah yang sudah tercatat dan melanggar matriks ini
tetap boleh disunting selama jenisnya tidak diubah — aturan yang baru lahir
tidak menghukum operator atas keputusan yang sah ketika ia mengambilnya.
Pada staging per 7 September 2026 tidak ada satu pun pelanggar.

## Considered Options

**Mengunci penyuntingan Daurah lama yang melanggar.** Ditolak: ia mengubah
tiket perbaikan menjadi tagihan pembersihan data yang harus dilunasi lebih
dulu, dan menghentikan pekerjaan yang tidak ada hubungannya dengan matriks.

**Membedakan "boleh" dari "lazim" lewat peringatan.** Sebuah Daurah di luar
kelaziman tetap boleh dibuat, tapi diberi tanda. Ditolak: peringatan yang
tidak menghalangi apa pun akan diabaikan, dan menambah keadaan yang harus
ditampilkan di setiap permukaan.

**Membiarkan aturannya hidup di kepala operator saja.** Ini yang berjalan
sekarang. Ditolak karena Server Action adalah endpoint POST: apa pun yang
tidak dijaga server tidak dijaga sama sekali.

## Consequences

- Matriks ini bertetangga dengan ADR 0022 tapi menjawab pertanyaan lain. ADR
  0022 mengatur **siapa yang boleh menjadi perangkat** sebuah Daurah; ADR ini
  mengatur **Struktur mana yang boleh menggelarnya**. Keduanya bisa berubah
  sendiri-sendiri.
- Pilihan jenis di form akan menyempit mengikuti penyelenggara yang terpilih.
  Operator yang biasa melihat enam pilihan akan melihat dua di PK, dan itu
  disengaja.
- Kalau kelak sebuah PK diberi izin khusus menggelar DPMK, matriks ini tidak
  punya tempat untuk pengecualian per Struktur. Menambahkannya berarti
  memindahkan aturan dari kode ke data — perubahan yang lebih besar dari satu
  sel tabel.
