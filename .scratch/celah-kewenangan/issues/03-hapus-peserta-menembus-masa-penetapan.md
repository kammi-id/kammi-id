# 03 — Menghapus Peserta menembus Masa Penetapan Kelulusan

**What to build:** Menghapus Peserta yang **sudah punya Kelulusan** harus
tunduk pada Masa Penetapan Kelulusan. Menghapus Peserta yang belum dinilai
tetap cukup dengan Cakupan.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

`removeAttendantAction`
(`trainings/_components/training-detail-view/action.ts:437`) menjaga dirinya
dengan `assertCanManage`, bukan `assertCanEditPassing`. Sementara
`trainingQuery.removeAttendant` (`db/query/training.ts:429`) menghapus barisnya
secara permanen — `is_passing` ikut terbawa.

Jadi jalur yang ditutup di `updateAttendantStatusAction` terbuka lebar di
sebelahnya: Kelulusan bisa dihapus kapan saja dengan mengeluarkan Pesertanya.

**Jangan mengunci semua penghapusan.** Mengeluarkan Kader yang salah
didaftarkan adalah koreksi roster, bukan koreksi Kelulusan, dan itu sah
dilakukan kapan pun. Yang tunduk pada Masa Penetapan hanyalah penghapusan yang
ikut menghapus sebuah Kelulusan.

Bentuknya kira-kira: baca `isPassing` Peserta itu lebih dulu; kalau `true`,
lewatkan `assertCanEditPassing`; kalau `false`, `assertCanManage` sudah cukup.

**Ini aturan baru yang belum ada di `CONTEXT.md`.** Definisi Masa Penetapan
Kelulusan sekarang berbicara tentang "ditetapkan atau diubah", belum tentang
dihapus lewat pintu lain. Kalau tiket ini dikerjakan, tajamkan dulu definisinya
— gunakan `/domain-modeling`.

Modul `src/lib/daurah/masa-penetapan-kelulusan.ts` sudah ada dan sudah memuat
aturannya; tiket ini soal memanggilnya di tempat yang terlewat, bukan menulis
ulang aturannya.

- [ ] Menghapus Peserta ber-Kelulusan di luar Masa Penetapan ditolak
- [ ] Menghapus Peserta tanpa Kelulusan tetap boleh kapan pun
- [ ] Root masih boleh menghapus keduanya kapan pun
- [ ] Definisi Masa Penetapan Kelulusan di `CONTEXT.md` menyusul keputusan ini
- [ ] Ada tes untuk ketiga kasus di atas
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos
