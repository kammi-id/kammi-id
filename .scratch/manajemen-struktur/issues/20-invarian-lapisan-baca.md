# 20 — Invarian lapisan baca: saring Terhapus, loloskan Non-Aktif

**Type:** implementation
**Status:** open
**Blocked by:** 13

Spec: [`../spec.md`](../spec.md) §7 (seluruhnya), §1.4

## Pekerjaan

**Tiap pembacaan atas tabel yang mereferensi `organization` wajib menyaring Struktur
Terhapus. Struktur Non-Aktif TIDAK disaring.**

**Asimetri itu inti aturannya, dan ia wajib dipertahankan.** Keputusan penelusuran
tiket 27 bergantung padanya: Non-Aktif tetap terlihat dari dalam dasbor beserta
isinya, Terhapus diperlakukan seolah barisnya tidak pernah ada.

Ini **aturan, bukan temuan** — pembaca yang belum lahir mewarisinya tanpa harus
menemukannya ulang.

### Tujuh referensi

| Referensi | Yang dikerjakan |
| --- | --- |
| `organization.parent_id` | Terhapus tidak boleh muncul sebagai anak — di pohon, di dropdown induk, di agregat, di pencarian |
| `member.organization_id` | lihat kasus konkret di bawah |
| `training.organization_id` | hampa oleh prasyarat, **tetap disaring demi keseragaman** |
| `article.organization_id` | pembacanya belum ada — pasang aturannya, bukan permukaannya |
| `article_category.organization_id` | idem |
| `site_settings.organization_id` | idem |
| `user.connected_organization_id` | **JANGAN DISARING** — lihat di bawah |

### `user` dikecualikan, dan itu disengaja

Keadaan Akun sudah dijaga tiket 19 di `readActiveSession`/`validateSession`, bukan
oleh filter baca. Menyaring Terhapus dari pembacaan `user` justru akan
**menyembunyikan baris Akun dari permukaan administratif yang perlu melihatnya**.

Gerbangnya di sesi. **Jangan tambahkan yang kedua di lapisan baca.**

### Kasus konkret: perbaiki yang benar-benar bocor

**`readMemberAggregates` bocor** (`src/db/query/member.ts:145-147`). Ia memancarkan
**satu baris per organisasi di subtree**, dikunci `organizationId`, terlepas dari
berapa Member yang menempel — jadi Struktur Terhapus muncul sebagai **entri
berhitungan nol**. Struktur yang seharusnya tak terlihat, hadir di daftar.

**`readDescendantMembers` TIDAK bocor** (`src/db/query/member.ts:459-463`, `:523`).
Ia menyaring `m.deleted_at IS NULL`, dan prasyarat penghapusan menjamin Struktur
Terhapus punya **nol Member hidup** — jadi ia tidak menghasilkan satu baris pun.

> **Jangan tambal `readDescendantMembers`.** Tambalan di tempat yang salah tidak
> menutup apa pun, dan rumusan lama yang menyebut "kedua CTE menyedot Kader milik
> Struktur Terhapus" sudah dikoreksi — bukan Kader yang tersedot, melainkan barisnya
> sendiri yang muncul.

Keduanya memakai `WITH RECURSIVE org_tree` yang menelusuri `parent_id` **tanpa satu
pun filter Keadaan**. Setelah invarian ini terpasang, `org_tree` menyaring
**Terhapus** dan **tetap meloloskan Non-Aktif** — sebab justru pelolosan itu yang
membuat tiket 27 sah: Kader di bawah sebuah PD Non-Aktif **tetap terbaca dari daftar
Kader PW induknya**, teragregasi ke atas.

### Satu fungsi baca yang sengaja terbalik

Permukaan tiket 28 butuh membaca Struktur Terhapus. Sediakan **tepat satu** fungsi
baca yang sengaja melakukan kebalikan invarian ini, dipakai oleh **tepat satu**
permukaan. Bukan flag di fungsi baca biasa, dan bukan filter berbasis peran — filter
berbasis peran di `/dashboard/branches` melubangi invarian di halaman yang paling
sering dibaca, dan lubang di permukaan tersibuk adalah lubang yang paling mahal.

### Slug Struktur Terhapus → 404

`getCachedOrganization(slug)` (`dashboard/_data/organizations.ts:16`) dan
kawan-kawannya: slug yang menunjuk Struktur Terhapus menghasilkan **404, sama persis
dengan slug yang memang tidak pernah ada**. Tidak ada permukaan yang berkata
"Struktur ini sudah dihapus" — kalimat itu sendiri membocorkan bahwa ia ada.

## Selesai bila

- Ketujuh referensi tunduk (dengan `user` sebagai pengecualian yang **terdokumentasi
  di kode**, bukan terlupa)
- `readMemberAggregates` tidak lagi memancarkan baris untuk Struktur Terhapus
- `readDescendantMembers` **tidak** disentuh
- Non-Aktif masih lolos di kedua CTE — buktikan, jangan asumsikan
- Slug Struktur Terhapus → 404
