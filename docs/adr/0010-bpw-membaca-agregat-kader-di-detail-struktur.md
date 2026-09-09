# BPW membaca agregat Kader di detail Struktur

BPW mengelola kestrukturan, bukan data Kader, sehingga daftar dan halaman
pengelolaan Kader tetap tertutup baginya. Kami memutuskan satu pengecualian
terbatas: pada detail Struktur di `/dashboard/branches`, BPW boleh membaca
ringkasan agregat Kader Aktif dalam Cakupan Struktur yang sedang dibuka
(total, AB1/AB2/AB3, Ikhwan/Akhwat, Pemandu, dan Instruktur). Angka ini
membantu BPW menilai Struktur tanpa membuka identitas maupun daftar Kader.

## Consequences

Jangan memperluas pengecualian ini menjadi akses `kader` atau daftar Kader bagi
BPW. Query agregat yang dipakai detail Struktur harus diberi gate khusus untuk
permukaan ini; gate umum pengelolaan Kader tetap menolak BPW.
