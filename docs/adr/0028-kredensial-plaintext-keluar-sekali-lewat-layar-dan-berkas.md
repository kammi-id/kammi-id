# Kredensial plaintext keluar sekali, lewat layar dan berkas — sistem ini tidak punya kanal lain

Sistem ini menerbitkan Akun tanpa pernah bisa menghubungi pemiliknya. Tidak ada
alamat surel pada tabel `member` maupun `user`, tidak ada pengirim surel yang
terpasang, dan `member.phone` tidak dijamin terisi. Sebuah Akun yang dibuat
karenanya tidak punya jalan untuk memberitahu orangnya bahwa ia ada — kecuali
lewat orang yang membuatnya.

Selama ini keadaan itu ditangani tiga kali dengan tiga jawaban berbeda, dan
salah satunya adalah lupa. `createOrganization` mengembalikan `credentials`
lengkap dengan plaintext dan menampilkannya di panel. `bulk-upload` melewati
`createMember` sepenuhnya, memanggil `createUser` sendiri, dan menampilkan
plaintext-nya. Sementara `createMember` — jalur yang dipakai `add-form` untuk
seorang Kader tunggal — membangkitkan password, menyimpan hash-nya, lalu
**membuang plaintext-nya**. Setiap Kader yang didaftarkan satu per satu punya
Akun yang tidak pernah bisa ia masuki.

## Decision

**Plaintext sebuah kredensial ditampilkan tepat sekali, pada saat ia dibuat,
kepada pengurus yang membuatnya — lalu tidak pernah bisa dibaca lagi.** Tiga
permukaan menerapkan satu aturan yang sama:

1. **`add-form`** — `createMember` mengembalikan plaintext-nya, dan formulir
   menampilkannya lewat panel kredensial yang sudah dipakai `bulk-upload`.
2. **`bulk-upload`** — sudah begini; yang berubah hanya bahwa ia berhenti
   menjadi pengecualian.
3. **Regenerasi massal** — kredensial keluar sebagai **berkas CSV yang diunduh**,
   sebab seorang BPK yang mereset dua ratus Kader tidak akan menyalinnya dari
   dialog.

**Yang tersimpan tetap hanya hash.** Tidak ada kolom plaintext, tidak ada tabel
kredensial, tidak ada jalan untuk membaca ulang password seorang Kader. Sekali
panelnya ditutup atau CSV-nya hilang, satu-satunya jalan adalah menerbitkan
password baru — dan itu memang perilaku yang benar.

**Mereset password mematikan sesi yang sedang hidup.** `deleteSessionsByUser`
dipanggil dari reset tunggal maupun regenerasi massal. Tanpa itu, "reset
password Kader ini" tidak berarti apa yang dikira pengurus yang menekannya:
cookie lama tetap sah sampai tiga hari, sehingga justru kasus yang paling sering
menjadi alasan reset — akun yang dipakai orang lain — adalah kasus yang paling
buruk ditangani. Kader yang mengganti password-nya sendiri di
`/dashboard/user/account` juga memutus seluruh sesinya yang lain, **kecuali**
sesi yang sedang ia pakai.

## Considered Options

**Menunggu kanal surel.** Jawaban yang benar, dan tidak tersedia: ia menuntut
kolom surel yang belum ada, pengisiannya untuk puluhan ribu Kader yang sudah
terdaftar, dan penyedia pengiriman beserta domain terverifikasi. Menahan fitur
login Kader sampai semua itu ada berarti menahannya tanpa tanggal.

**Password awal yang bisa diturunkan** — tanggal lahir, atau NIA itu sendiri.
Ditolak tanpa ragu: ia menjadikan setiap Kader dapat masuk ke akun Kader lain
dengan data yang tercetak di daftar hadir Daurah.

**Tautan aktivasi sekali pakai.** Memindahkan rahasianya dari password ke
tautan, tetapi tautan itu tetap harus sampai ke orangnya lewat kanal yang sama —
mulut pengurus atau WhatsApp. Ia menambah tabel token dan masa berlaku tanpa
menutup satu pun celah yang nyata di sini.

## Consequences

- **Rahasia ini menyeberang ke kanal yang tidak dikuasai sistem** — dibacakan,
  difoto, dikirim lewat WhatsApp. Itu diketahui dan diterima. Mitigasinya
  bukan teknis melainkan berjangka: Kader mengganti password-nya sendiri setelah
  masuk, dan `updatePasswordAction` sudah bekerja untuk semua peran.
- **Berkas CSV berisi kredensial mudah tertinggal.** Preseden ini sudah ada dan
  sudah ditangani sekali: `users.csv` di akar repositori berisi 1.720 baris
  kredensial Akun Kepengurusan dan terdaftar di `.gitignore` baris 52. Pola CSV
  regenerasi harus mewarisi perlakuan yang sama, dan `.gitignore` perlu memuat
  polanya sebelum fitur ini tayang, bukan sesudah berkas pertamanya dibuat.
- `createMember` berubah tanda tangannya — ia kini mengembalikan kredensial di
  samping Member. Pemanggilnya sedikit, dan `credential-generation.test.ts`
  sudah menguji sisi hash-nya.
