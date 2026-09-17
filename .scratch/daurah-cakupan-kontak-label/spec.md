# Daurah: Cakupan, kontak MoT, dan label yang terbaca

Enam perbaikan yang lahir dari satu sesi penelusuran bersama pengambil
keputusan. Sebagian membetulkan lubang kewenangan, sebagian menuntaskan fitur
yang setengah jalan, sebagian merapikan apa yang dibaca pengguna.

Tiketnya berdiri sendiri-sendiri dan sengaja tidak digabung: satu PR per tiket,
dikerjakan berurutan 01 → 06, dan 05 menunggu 04 mendarat.

## Yang diputuskan

**Cakupan pembuatan Daurah.** BPK boleh menyelenggarakan Daurah atas nama
Strukturnya sendiri dan seluruh Struktur turunannya. Hari ini server tidak
memeriksanya sama sekali.

**Jenis Daurah dibatasi Jenjang penyelenggara.** Matriksnya ada di ADR 0025.
Aturan baru menghakimi perbuatan baru: Daurah lama yang melanggar dibiarkan
hidup, tidak dikunci.

**Master of Training tunggal.** Satu Daurah paling banyak memegang satu
Instruktur ber-peran `master`. Pilihan MoT kedua ditolak, bukan menggeser yang
pertama diam-diam.

**Nomor kontak disimpan E.164.** Satu kolom, dengan pengecualian nomor asing.
Rinciannya di ADR 0026.

**Tombol WhatsApp MoT** muncul untuk yang berhak mengelola Daurah, bukan untuk
seluruh pembaca halaman detail. BPH memantau, tidak menghubungi.

**Kode mesin tidak dipertontonkan.** Peta label disatukan; `AB1` tanpa spasi.

## Keadaan data (staging, 7 September 2026)

Staging membawa data production (ADR 0009), jadi angka ini indikatif untuk
production tapi bukan penggantinya. Diambil ulang sebelum migrasi dijalankan.

- **MoT ganda: 0.** Tidak ada Daurah yang melanggar aturan MoT tunggal.
- **Pelanggaran matriks: 0.** Sebaran yang ada — PD: DM1, DM2, TFI; PK: DM1;
  PW: DM3; PP: DM2, DM3 — seluruhnya sah di bawah matriks baru.
- **Nomor HP:** 4900 Member, 1927 kosong, 2973 terisi. Dari yang terisi, 2944
  aman dikonversi (`08…`, `8…`, `62…`, dan `+62` bertanda hubung), 29 cacat
  (`062…` berawalan dobel, `-`, digit kelebihan). Tidak ada satu pun nomor
  berkode negara selain 62.

Dua angka nol pertama membuat migrasi 01 dan 03 jauh lebih murah dari dugaan
awal: keduanya memasang aturan, bukan membersihkan warisan.

## Tiket

| # | Judul | Bergantung pada |
| --- | --- | --- |
| 01 | Gate Cakupan dan matriks Jenjang untuk pembuatan Daurah | — |
| 02 | Template impor XLSX rusak: urutan elemen OOXML | — |
| 03 | Master of Training tunggal per Daurah | — |
| 04 | Nomor kontak dalam format E.164 | — |
| 05 | Tombol WhatsApp MoT di detail Daurah | 04 |
| 06 | Kode mesin bocor ke tabel dan tampilan detail | — |
