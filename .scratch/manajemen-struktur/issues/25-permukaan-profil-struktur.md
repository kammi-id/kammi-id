# 25 — Permukaan `Profil <nama Struktur>` — `/dashboard/organization`

**Type:** implementation
**Status:** open
**Blocked by:** 18

Spec: [`../spec.md`](../spec.md) §8.1, §2.4, §4.3

**Panggil `/impeccable`, `/shadcn`, dan `base-ui-docs`.** Repo ini memakai **BaseUI**
sebagai lapisan primitif Shadcn, **bukan RadixUI**.

## Pekerjaan

Halaman BPH untuk menyunting identitas Strukturnya sendiri. `/dashboard/branches`
menampilkan **anak-anak** dari Struktur yang dibuka — form Edit di sana selalu
mengedit anak, tidak pernah dirinya sendiri.

**Rute: `/dashboard/organization`.** Bukan `user/organization` (menyatakan
kepemilikan yang keliru — Struktur dipegang bersama sampai empat Akun), bukan
`branches/saya` (`branches/[[...slug]]` itu catch-all opsional; segmen statis di
sebelahnya menciptakan dua aturan rute yang harus diingat bersamaan), bukan
`kepengurusan`.

**Entri menu: `Profil <nama Struktur>`, dinamis** — mis. "Profil PW KAMMI NTB". Di
dropdown Akun kiri-bawah sidebar (`nav-user.tsx:93`). **Hanya BPH yang melihatnya.**

> **Jangan pakai kata "Kepengurusan" untuk menamai apa pun.** Istilah itu
> **dicadangkan** untuk permukaan daftar pengurus yang belum dibangun. Fakta domain,
> bukan preferensi.

**Panjang nama:** satu baris, biarkan `truncate`, dengan `title` berisi nama utuh —
**bukan** item dua baris. Nama utuhnya sudah terbaca dua baris di atas, di header
dropdown yang sudah ada (`nav-user.tsx:146-149`, diisi `connectedOrganization.name`
lewat `app-sidebar.tsx:154`). Pemotongan di sini tidak menghilangkan informasi apa
pun. `truncate` sudah jadi idiom komponen itu sendiri.

Judul **halamannya** memakai bentuk utuh tanpa potong.

**Ikut dikerjakan:** menu itu sekarang campur bahasa — "Account / Notifications / Log
out" berbahasa Inggris sementara judul halamannya "Pengaturan Akun". Seragamkan
tetangganya jadi **"Akun", "Notifikasi", "Keluar"**.

### Isi halaman: blok identitas + form, titik

```
┌──────────────────────────────────────────────┐
│  [logo]   PW KAMMI NTB                       │
│           PW · 19.PW-NTB                     │   ← mono untuk code
│           di bawah PP KAMMI                  │
├──────────────────────────────────────────────┤
│  Nama Struktur   [ PW KAMMI NTB          ]   │
│  Slug            [ pw-kammi-ntb          ]   │
│                  Mengubah slug mematahkan     │
│                  tautan publik yang lama.     │
│  Logo            [ unggah ]                   │
│                              [ Simpan ]       │
└──────────────────────────────────────────────┘
```

- **`code`, Jenjang, dan induk ditampilkan sebagai blok identitas, BUKAN kontrol
  form.** `code` pakai **mono** (DESIGN.md: "Do use the Mono font for IDs, NIKs, and
  status codes").
  - **"Input disabled + gembok" ditolak** — input mati terbaca "kamu kurang izin",
    padahal ketiganya beku selamanya untuk **semua orang, Root termasuk**. PRODUCT.md
    menyebut sebagian penggunanya gaptek.
  - **"Sembunyikan total" ditolak** — `code` menurunkan Nomor Induk tiap Kader di
    bawahnya, dan `branches` hanya menampilkan anak, jadi tanpa halaman ini BPH tidak
    punya satu pun tempat untuk melihat kodenya sendiri.
  - Hasilnya: **form berisi tiga field, ketiganya hidup. Nol kontrol mati.**
- **Tanpa hitungan anak, hitungan Kader, maupun daftar Akun terhubung.** Alasannya
  bukan ongkos melainkan peran: halaman ini **administrasi diri sendiri, bukan
  monitoring** — dan dua tempat yang menampilkan angka yang sama adalah dua tempat
  yang suatu hari menampilkan angka berbeda. Daftar Akun terhubung juga memancing
  pertanyaan yang belum ada jawabannya (boleh tidak BPH mengundang atau mencabut
  Akun?). **Menambahkan angka nanti itu murah; mencabut angka yang sudah dilihat
  orang itu mahal.**
- **Keadaan Struktur tidak ditampilkan sama sekali** — nol badge, nol toggle, nol
  penjelasan. Akun kepengurusan Struktur Non-Aktif berhenti bisa dipakai (tiket 19)
  dan BPH adalah Akun kepengurusan, jadi halaman ini **hanya pernah dirender untuk
  Struktur Aktif**.

### Ongkos data: nol query tambahan

Sesi sudah membawa seluruh Struktur terhubung — `id, name, slug, code, codeSlug,
type, level, logo, parentId, isNonActive` (`src/db/query/cte/user.ts:16-27`). Yang
berbayar hanya **nama induk** (1 join).

Gate BPH dari tiket 18 **mengembalikan Struktur itu** — satu panggilan melayani
otorisasi sekaligus pembacaan data halaman.

### Keadaan dan galat

| Kejadian | Perlakuan |
| --- | --- |
| Slug bentrok (`23505`) | galat **di field slug**, bukan toast — bisa diperbaiki di tempat. **Pola yang sama persis dengan tiket 28** |
| Slug diubah → URL publik lama patah | **tidak diblokir**; peringatan tenang di `FieldDescription`, bukan dialog |
| Akun tanpa Struktur terhubung | ada di data (`app-sidebar.tsx:154` bercadangan `'No Organization'`). Gate menolaknya; menunya tidak muncul |
| Sukses | toast (`sonner`), pola `add-form` |
| Logo | `~/components/image-upload` apa adanya, termasuk pembersihan berkas yatim saat batal (pola `add-form.tsx:77-83`) |

## Selesai bila

- BPH bisa menyunting nama, slug, logo Strukturnya sendiri; nol Kewenangan lain bisa
  membuka rutenya
- `code`/`type`/`parentId` tidak ada sebagai kontrol form dalam bentuk apa pun
- Slug bentrok mendarat di field, bukan toast
- Menu dropdown seragam berbahasa Indonesia
- `bun run check:structure`, `check:lint`, `check:types` hijau
