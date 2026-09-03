# 02 — Luruskan istilah Perangkat di halaman profil

**What to build:** Halaman profil menyebut jalur sertifikasi Perangkat dengan
benar. Seorang pengurus yang membaca layar itu tahu bahwa Pemandu lahir dari
DPMK, bukan dari Daurah Marhalah.

**Blocked by:** None — can start immediately.

**Status:** done

Dua tempat di `profile/[registerNumber]/_components/profile-sidebar/` menulis
"DM" padahal yang dimaksud DPMK:

- Keterangan toggle Pemandu: "Lulus DM dan bersertifikat pemandu"
- Kalimat keadaan kosong: "Diperoleh setelah lulus DM atau TFI"

Keduanya salah dengan cara yang sama: DM adalah Daurah Marhalah, yang menaikkan
Jenjang Kekaderan dan tidak menghasilkan Perangkat sama sekali. Yang
menghasilkan Pemandu adalah DPMK. Keterangan toggle Instruktur ("Lulus TFI")
sudah benar dan tidak perlu disentuh.

**Ini murni perbaikan teks, bukan perbaikan logika.** Nilai yang tersimpan,
cara sertifikasi ditentukan, dan penanda peringatan yang sudah ada semuanya
sudah benar — jangan ikut diubah.

**Penanda Sertifikasi Tanpa Riwayat sudah ada dan sudah bekerja.** Tooltip
peringatan muncul di tampilan baca ketika sertifikasi tercatat tanpa Daurah
Sertifikasi yang mendasarinya. Yang belum ada hanyalah namanya — `CONTEXT.md`
kini menyebutnya **Sertifikasi Tanpa Riwayat**. Selaraskan bunyi tooltip dengan
istilah itu, dan pastikan nadanya tetap "riwayat perlu dilengkapi", bukan
"data salah": banyak Perangkat senior disertifikasi jauh sebelum sistem ini
ada, jadi peringatan yang terdengar seperti tuduhan akan menyala di mana-mana
dan langsung diabaikan orang.

**Jangan pindahkan penanda itu ke dalam form edit.** Kalau memang diinginkan di
sana, itu keputusan tersendiri, bukan bagian tiket ini.

- [x] Kedua kalimat "DM" di sidebar profil menyebut DPMK
- [x] Keterangan toggle Instruktur tidak berubah
- [x] Bunyi tooltip peringatan selaras dengan istilah Sertifikasi Tanpa Riwayat
      dan tetap bernada melengkapi, bukan menyalahkan
- [x] Tidak ada perubahan pada logika sertifikasi, nilai tersimpan, atau kapan
      penanda muncul
- [x] `bun run check:types` lolos
- [x] Seluruh tes lolos

## Comments

**19 Agustus 2026 — teks disamakan, dua tooltip ikut disebut namanya.**

Kedua kalimat "DM" di `profile-sidebar.tsx` diganti "DPMK" (toggle Pemandu dan
kalimat keadaan kosong). Toggle Instruktur ("Lulus TFI") tidak disentuh. Kedua
tooltip peringatan (Pemandu dan Instruktur) diberi awalan "Sertifikasi Tanpa
Riwayat —" supaya istilah `CONTEXT.md` kelihatan langsung di UI, nadanya tetap
"lengkapi riwayat daurah", bukan tuduhan data salah. Tidak ada logika,
nilai tersimpan, atau kondisi kemunculan penanda yang berubah.
