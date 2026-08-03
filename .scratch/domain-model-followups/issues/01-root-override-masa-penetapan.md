# 01 — Root boleh menetapkan Kelulusan di luar Masa Penetapan

**What to build:** Root dapat menetapkan atau mengubah Kelulusan sebuah Daurah
kapan pun, termasuk saat Daurah masih berlangsung dan setelah 30 hari sejak
Daurah selesai. Bagi semua kewenangan lain, Masa Penetapan Kelulusan tetap
mengunci seperti sekarang.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Aturannya sudah disepakati dan sudah tertulis di `CONTEXT.md` sebagai bagian
dari definisi **Masa Penetapan Kelulusan** — tiket ini hanya membuat kode
menyusul definisi itu. Pakai kosakata `CONTEXT.md` saat menamai apa pun di
sini.

**Kedua sisi jendela ikut terbuka untuk Root, bukan hanya sisi penutupnya.**
Gate hari ini menolak dua hal: menilai sebelum Daurah selesai, dan menilai
lebih dari 30 hari sesudahnya. Root menembus dua-duanya. Alasannya sama untuk
keduanya — Root adalah kewenangan pemulih keadaan, dan koreksi data yang
terlanjur salah tidak mengenal arah waktu.

**Ini menambah kewenangan pada aplikasi yang sudah berjalan di production.**
Karena itu perubahannya harus sesempit mungkin: satu jalur khusus di gate yang
sudah ada, bukan perombakan cara gate itu bekerja. Pengecekan kewenangan dan
Cakupan yang berjalan lebih dulu **tidak boleh disentuh** — Root memang sudah
lolos di sana, dan tiket ini bukan tentang itu.

**Jangan longgarkan gate untuk kewenangan lain.** Kalau diff mulai menyentuh
perilaku BPK atau BPH, ada yang salah.

File yang dituju: `assertCanEditPassing` di
`trainings/_components/training-detail-view/action.ts`. Tes untuk gate ini
sudah ada dan cukup rapat (enam kasus, termasuk batas hari ke-30 dan ke-31) di
`action.test.ts` sebelahnya — tambahkan kasus baru mengikuti pola yang sudah
ada di sana, jangan bikin gaya baru.

- [ ] Root dapat menetapkan Kelulusan saat Daurah masih berlangsung
- [ ] Root dapat menetapkan Kelulusan lebih dari 30 hari setelah Daurah selesai
- [ ] Kewenangan selain Root masih ditolak di kedua sisi jendela, dengan pesan
      yang sama persis seperti sekarang
- [ ] Pengecekan kewenangan dan Cakupan sebelum gate ini tidak berubah
- [ ] Tes baru mengikuti pola tes yang sudah ada di file yang sama
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
