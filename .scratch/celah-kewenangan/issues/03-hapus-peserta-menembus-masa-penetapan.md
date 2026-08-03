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

**Definisinya sudah ditajamkan — tiket ini tidak lagi menunggu keputusan.**
`CONTEXT.md` kini menyatakan Kelulusan boleh "ditetapkan atau dicabut", dan
bahwa pencabutan tunduk pada masa ini **lewat pintu mana pun**, termasuk
mengeluarkan Pesertanya. Lihat `docs/adr/0003-kelulusan-hanya-punya-satu-sisi.md`.

Modul `src/lib/daurah/masa-penetapan-kelulusan.ts` sudah ada dan sudah memuat
aturannya; tiket ini soal memanggilnya di tempat yang terlewat, bukan menulis
ulang aturannya.

- [ ] Menghapus Peserta ber-Kelulusan di luar Masa Penetapan ditolak
- [ ] Menghapus Peserta tanpa Kelulusan tetap boleh kapan pun
- [ ] Root masih boleh menghapus keduanya kapan pun
- [x] Definisi Masa Penetapan Kelulusan di `CONTEXT.md` menyusul keputusan ini
- [ ] Ada tes untuk ketiga kasus di atas
- [ ] `bun run check:types` lolos
- [ ] Seluruh tes lolos

## Comments

**Keputusan domain sudah diambil lewat `/domain-modeling`; bentuk yang tiket
ini usulkan lolos apa adanya.** Baca `isPassing` Peserta lebih dulu; `true`
lewat `assertCanEditPassing`, `false` cukup `assertCanManage`.

Tapi perhatikan **kenapa** itu benar, supaya tidak dikira lubang: `is_passing`
adalah `boolean NOT NULL DEFAULT false`, dan UI-nya kotak centang dua keadaan.
Peserta yang dinilai tidak lulus dan Peserta yang belum pernah dinilai adalah
baris yang **identik**. ADR-0003 memutuskan mengikuti data: Kelulusan hanya
punya satu sisi, dan ketiadaannya bukan sebuah keputusan yang tersimpan.
Karena itu mengeluarkan Peserta ber-`false` bukan pencabutan Kelulusan,
sekalipun di dunia nyata ia pernah dinilai tidak lulus.

**Pintunya cuma dua, dan yang satu sudah tertutup.** `deleteTrainingAction`
(`training-detail-view/action.ts:251`) menolak selama Daurah masih punya
Peserta lewat `trainingQuery.hasDependents`, jadi menghapus Daurah bukan jalan
pintas — ia harus lewat `removeAttendant` dulu. Setelah tiket ini, kedua pintu
tertutup tanpa perubahan tambahan di `deleteTrainingAction`.

**Jangan ikut mengunci penghapusan Instruktur.** `removeInstructor` ada di
sebelahnya dan bentuknya mirip, tapi Peran Instruktur bukan Kelulusan dan tidak
tunduk pada masa ini.
