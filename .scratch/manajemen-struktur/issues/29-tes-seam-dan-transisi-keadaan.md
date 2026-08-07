# 29 — Tes seam dan transisi Keadaan

**Type:** implementation
**Status:** open
**Blocked by:** 18, 21, 22, 23, 24

Spec: [`../spec.md`](../spec.md) §9.3, §1.5, §2.2

## Pekerjaan

**Nol tes untuk seluruh permukaan ini hari ini.** Empat lapis, dan seam-nya sudah
ditentukan oleh keputusan-keputusan sebelumnya — tidak perlu dicari lagi.

| Lapis | Bentuk | Seam |
| --- | --- | --- |
| **Matriks** | tabel argumen-ke-hasil, **nol fixture** | `canManageKestrukturan` |
| **Gate async** | tes seam, pola `src/lib/auth/kekaderan.test.ts` | tiga gate di `kestrukturan.ts` + gate `pulihkan` |
| **Transisi Keadaan** | tabel spec §1.5 jadi daftar kasus | jalur aksi (nonaktifkan / aktifkan / hapus / pulihkan) |
| **Penurunan NIA** | unit, **dua salinan** | `resolveOrgCodes`, `generateRegisterNumber`, dan salinan di `bulk-upload/action.ts` |

### Lapis 1 — matriks sebagai tabel argumen ke hasil

`canManageKestrukturan` dibuat **murni justru supaya ini mungkin**: tabelnya dites
tanpa satu pun fixture, bukan sebagai delapan tes integrasi. Kalau tes lapis ini
butuh basis data, ada yang salah di tiket 18, bukan di sini.

Turunkan kasusnya dari matriks spec §2.2 **secara lengkap** — termasuk sel-sel yang
berbunyi "tidak". Sel kosong yang tidak pernah dites adalah sel kosong yang kembali.

Yang paling gampang salah dan **wajib punya kasusnya sendiri**:

- Root × `nonaktifkan` × PP → **tidak**
- BPW PP × `hapus` × PW → **boleh** (yang melindungi PW adalah prasyarat, bukan
  kewenangan)
- BPW PW × apa pun selain baca → **tidak**
- BPW PD/PDLN × `pulihkan` → **tidak**
- BPW PP × `pulihkan` → **boleh**
- BPW × Strukturnya sendiri → **tidak** (aturan "di bawah", bukan "di dalam")
- BPK, Humas, Akun Kader × seluruh baris → **tidak**

### Lapis 2 — gate async

Pola `src/lib/auth/kekaderan.test.ts` sudah terbukti jalan untuk permukaan ini.
`kestrukturan.test.ts` yang sudah ada (17 tes untuk dua gerbang sempit yang tiket 18
buang) **dirombak**, bukan ditambahi.

Gate `pulihkan` dapat perhatian ekstra: buktikan **BPW PD dan BPW PDLN ditolak**,
bukan cuma bahwa BPW PP lolos.

### Lapis 3 — transisi Keadaan

Tabel spec §1.5 jadi daftar kasus langsung, ditambah prasyaratnya:

- Aktif → Non-Aktif dengan anak Aktif → **ditolak**
- Aktif → Non-Aktif dengan anak Non-Aktif saja → **berhasil**
- PP → Non-Aktif → **ditolak, siapa pun pelakunya**
- Non-Aktif → Aktif dengan induk Non-Aktif → **ditolak**
- Non-Aktif → Terhapus → **berhasil**, `is_non_active` **tetap menyala**
- Terhapus → Aktif → mengosongkan **dua** kolom
- Hapus dengan anak Terhapus saja → **berhasil**
- Hapus dengan Artikel menggantung → **berhasil**
- Hapus dengan Member hidup → **ditolak, Root juga**

### Lapis 4 — NIA

**Dua salinan wajib dites terpisah dan dibuktikan sepakat** — `src/lib/utils/member.ts`
dan `bulk-upload/action.ts:110-145`. Ini satu-satunya yang menahan keduanya tidak
menjadi dua sistem penomoran.

Ditambah: PK menurunkan dari induk, cadangan ke kode sendiri saat kode induk tidak
terurai, dan PD/PDLN/PW tidak berubah perilakunya.

## Sebelum menjalankan tes

> **Tes lokal repo ini menghantam satu basis data remote bersama.** Itu sebab tes
> `access-control` pernah terlihat flaky — bukan sifat berkasnya. **Konfirmasi ke
> pengguna sebelum menjalankan `bun test`.**

Ganjalan CI (`postgres:16` vs `uuidv7()` yang butuh PG 18+) diselesaikan tiket 17.
Tanpa itu, lapis 3 tidak bisa hijau di CI.

## Selesai bila

- Keempat lapis ada
- Lapis 1 jalan tanpa basis data
- Kedua salinan NIA terbukti sepakat
- `bun test` hijau (setelah konfirmasi pengguna), `bun run check:types` hijau
