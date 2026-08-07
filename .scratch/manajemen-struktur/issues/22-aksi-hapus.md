# 22 — Aksi hapus

**Type:** implementation
**Status:** open
**Blocked by:** 13, 18, 20

Spec: [`../spec.md`](../spec.md) §3, §1.3, §1.5

## Pekerjaan

**Penghapusan selalu soft.** Tidak ada hard delete, selamanya (ADR 0004), dan setelah
tiket 13 basis data sendiri yang menjaminnya.

Menulis `deleted_at` beserta `deleted_by`. **`is_non_active` tidak disapu** —
Terhapus mendominasi Non-Aktif, tapi mendominasi bukan berarti menghapus. Struktur
yang Non-Aktif lalu dihapus tetap menyala `is_non_active`, dan itu sah.

### Prasyarat — berbunyi lengkap

**Nol Struktur anak, nol Member, nol Daurah.**

Tiga klausa yang diputus di tiket berbeda dan gampang hilang saat dirakit. Tulis
ketiganya:

1. **Anak Non-Aktif MENGHITUNG.** Induk dengan anak Non-Aktif tidak bisa dihapus
   selama anak itu masih ada. Itu tidak apa-apa — penghapusan memang untuk salah
   catat.
2. **Anak Terhapus TIDAK menghitung.** Terhapus diperlakukan seolah barisnya tidak
   pernah ada, jadi ia tidak boleh menahan apa pun. Konsekuensi yang dibayar sadar:
   **rantai Terhapus-di-bawah-Terhapus jadi mungkin** — tiket 28 yang menanganinya.
3. **Publikasi BUKAN prasyarat.** Artikel, Kategori Artikel, dan Pengaturan Situs
   boleh menggantung.

### Prasyarat berlaku untuk SEMUA, Root termasuk

**Cakupan membatasi jangkauan; prasyarat menjaga konsistensi. Root menembus yang
pertama, tidak pernah yang kedua.**

Prasyarat **tidak masuk gate mana pun** (tiket 18). Ia diperiksa di jalur ini,
**terpisah dan sesudah gate**. Menaruhnya di dalam gate akan membuat orang
menyimpulkan bahwa Kewenangan yang cukup tinggi bisa menembusnya.

### Keadaan asal tidak dilihat

Struktur Non-Aktif boleh langsung dihapus. Prasyarat nol-isi adalah **satu-satunya**
penjaga. Mengharuskan Struktur diaktifkan dulu sebelum dihapus itu ritual tanpa
perlindungan tambahan — orang tinggal klik Aktifkan lalu Hapus, dan Struktur
Non-Aktif yang kosong melompong justru persis kasus "dibuat lalu tidak jadi berjalan"
yang penghapusan ada untuknya.

### Galatnya harus cukup kaya untuk kalimat

Permukaan (tiket 26) menulis "Tidak bisa dihapus: masih ada 847 Kader dan 3
Komisariat" sebagai **kalimat utuh**, bukan tooltip. Aksinya mengembalikan hitungan
per prasyarat, bukan boolean.

### Cache

`updateTag` di `action.ts`, berpasangan dengan `cacheTag` di `_data/`.

## Selesai bila

- Menghapus Struktur yang punya Member hidup ditolak — **Root juga**
- Menghapus Struktur yang punya anak Non-Aktif ditolak
- Menghapus Struktur yang anaknya cuma Terhapus **berhasil**
- Menghapus Struktur yang punya Artikel menggantung **berhasil**
- `is_non_active` tidak berubah saat penghapusan
- Nol `db.delete` atas `organization` di mana pun
