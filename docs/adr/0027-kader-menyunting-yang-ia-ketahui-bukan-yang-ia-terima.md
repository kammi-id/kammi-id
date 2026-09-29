# Kader menyunting apa yang ia ketahui, bukan apa yang ia terima

`profileSchema` (`dashboard/profile/[registerNumber]/_components/action/schema.ts`)
hari ini adalah satu skema untuk satu tabel, dipakai oleh satu aksi. Aksi itu,
`updateMemberProfileAction`, sudah membedakan siapa yang boleh menulis —
`canEditMember` meloloskan Root, BPK, dan seorang `member` atas barisnya
sendiri — tetapi tidak pernah membedakan **apa** yang boleh ditulis. Ketiganya
menulis kolom yang sama persis.

Yang lolos lewat celah itu bukan teoretis. `profile-sidebar.tsx` merender
kontrol `status`, `isSuspended`, `isAlumn`, `isNonActive`, `isCertifiedMentor`,
dan `isCertifiedInstructor` setiap kali `isEditing` menyala, dan `isEditing`
dinyalakan oleh `canEdit` — yang bernilai benar bagi seorang Kader atas
profilnya sendiri. Seorang Kader yang masuk dengan NIA-nya dapat menaikkan
dirinya ke AB3, menandai dirinya Pemandu sekaligus Instruktur, dan mencabut
Sanksi-nya sendiri, lewat tombol yang memang disodorkan kepadanya. Ini berjalan
di production.

## Decision

**Satu tabel, dua skema.** `profileSchema` dipecah menurut asal-usul datanya,
bukan menurut permukaannya:

- **`memberSelfEditSchema`** — apa yang seorang Kader ketahui tentang dirinya:
  `name`, `gender`, `phone`, `photo`, `birthPlace`, `birthDate`, seluruh kolom
  alamat, dan riwayat pendidikan, karier, serta Organisasi Eksternal.
- **`memberManagedSchema`** — apa yang organisasi berikan kepadanya:
  `status` (Jenjang Kaderisasi), `isAlumn`/`isSuspended`/`isNonActive` (Keadaan
  Kader), `isCertifiedMentor`/`isCertifiedInstructor` (sertifikasi Perangkat),
  dan `yearOfEntry`. Root dan BPK saja, di dalam Cakupan.

Garis pemisahnya adalah **asal-usul**, bukan sensitivitas. Tanggal lahir lebih
pribadi daripada Jenjang Kaderisasi, dan justru tanggal lahir yang boleh
disunting sendiri. Yang menentukan bukan seberapa rahasia sebuah kolom,
melainkan siapa yang berhak menetapkannya: tiga sumbu di sisi kanan seluruhnya
diputuskan lewat Kelulusan sebuah Daurah atau keputusan kepengurusan, dan
sebuah Kewenangan yang bisa menetapkan sendiri jenjangnya membuat ketiga sumbu
itu berhenti berarti apa pun.

**Aksinya memilih skema dari peran, bukan dari isi FormData.** Sebuah kontrol
yang lupa disembunyikan dan sebuah POST yang dirakit tangan gagal lewat jalan
yang sama, karena keduanya bertemu skema yang memang tidak punya kolom itu.
Menyembunyikan kontrol di UI adalah akibat dari keputusan ini, bukan
penegakannya.

**`member.name` tetap boleh disunting sendiri.** Ia ada di sisi kiri meski ia
tercetak di **Kartu Tanda Anggota**. `user.name` — yang bagi Akun Kader adalah
NIA sekaligus identitas login — tidak: ia dikunci bagi `role = 'member'` di
`updateProfileAction` (`dashboard/user/account`), tempat ia hari ini bisa
ditulis siapa saja. Dua kolom bernama "name", dua jawaban berlawanan, dan
itulah sebabnya keduanya disebut di sini alih-alih diserahkan pada ingatan.

## Considered Options

**Menyembunyikan kontrolnya di `profile-sidebar` saja.** Perbaikan satu baris,
dan itu sebabnya ia menggoda. Ditolak: aksi Server tetap menerima kolomnya dari
FormData mana pun, jadi yang diperbaiki hanyalah kemudahannya, bukan
kemungkinannya.

**Satu skema dengan `.omit()` bercabang di dalam aksi.** Lebih ringkas, tetapi
menyimpan daftar kolom terlarang di tempat yang berbeda dari tempat kolom itu
didefinisikan. Kolom baru pada tabel `member` akan diam-diam jatuh ke sisi yang
salah, tanpa `tsc` mengeluh. Dua skema eksplisit memaksa penambah kolom
menyatakan sisinya.

**Menaruh `member.name` di sisi kanan.** Diusulkan dan ditolak oleh pengambil
keputusan. Argumen yang diajukan: nama pada sebuah kartu identitas yang bisa
diubah pemegangnya sendiri melemahkan kartunya. Argumen tandingan yang diterima:
kartu ini menampilkan dan tidak membuktikan (ADR 0029), dan koreksi salah ketik
nama adalah hal yang paling sering dibutuhkan seorang Kader. Jika verifikasi
pemindai kelak jadi ada, keputusan ini yang pertama harus ditinjau ulang.

## Consequences

- **Lubang Cakupan pada BPK ikut ditutup di sini**, sebab ia berada persis di
  fungsi yang dibongkar: `canEditMember` hari ini meloloskan **setiap** BPK atas
  **setiap** Member, tanpa `isOrgInScope`. Jalur hapus dan jalur reset password
  sudah memeriksa Cakupan; jalur sunting tidak pernah. Membiarkannya di dalam
  fungsi yang baru saja ditulis ulang adalah pilihan terburuk yang tersedia.
- **Permukaan bacanya ikut dikunci.** `/dashboard/profile/[registerNumber]`
  tidak punya gerbang baca sama sekali: setiap sesi bisa mengetikkan NIA mana
  pun dan menerima nomor telepon, alamat lengkap, tanggal lahir, serta riwayat
  akademik dan karier pemiliknya — sementara NIA berurutan di dalam satu Daerah
  (ADR 0020), jadi seluruh daftar nasional dapat ditelusuri dengan skrip.
  Rutenya menyelesaikan Member lebih dulu, lalu menanyakan
  `requireKaderisasiAccess(member.organizationId)`; `member` memotong lebih awal
  ke dirinya sendiri.
- Seorang Kader yang naik jenjang tetap harus menunggu BPK-nya. Itu memang
  keadaan hari ini — `updateAttendantStatus` belum menurunkan Kelulusan menjadi
  jenjang (lihat catatan pada **Kelulusan** di `CONTEXT.md`) — dan keputusan ini
  tidak memperburuknya, hanya menutup jalan pintas yang tidak pernah dimaksudkan
  ada.
- `CONTEXT.md` diamandemen: **Akun Kader** mendapat paragraf yang menyatakan
  bahwa "datanya sendiri" bukan berarti seluruh datanya.
