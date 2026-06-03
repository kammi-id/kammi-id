# Design: Koneksi Section "Tentang KAMMI" → /tentang

**Tanggal:** 2026-06-01  
**Scope:** Homepage about-section + site-settings type/defaults + dashboard form

---

## Masalah

Section "Tentang KAMMI" di homepage (`about-section.tsx`) punya dua link yang broken:
- `readMoreHref` → `#organisasi` (anchor tidak exist)
- Card kanan "Mini Strategi" dengan `miniStrategiLinkHref` → `#strategi` (anchor tidak exist)

Card "Mini Strategi" juga kurang relevan sebagai komplemen section Tentang KAMMI.

---

## Solusi

### 1. Fix `readMoreHref`
`#organisasi` → `/tentang`

Label tetap: `"Lebih jauh tentang kami"`

### 2. Ganti Card Kanan: Mini Strategi → Sejarah Singkat

**Konten card baru:**
- Icon: kalender sederhana
- Label kecil: `"Sejarah Singkat"`
- Heading: `"Lahir dari Rahim Reformasi"`
- Tanggal: `"29 Maret 1998 · Malang, Jawa Timur"`
- Deskripsi: kutipan dari sejarah-section (`"Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang konsisten menjaga arah perubahan tetap berada di jalur keadilan dan kebenaran."`)
- Link: `"Baca sejarah lengkap →"` → `/tentang#sejarah`

### 3. Rename Fields di `AboutSettings`

| Lama | Baru |
|------|------|
| `miniStrategiTitle` | `sejarahCardTitle` |
| `miniStrategiDescription` | `sejarahCardDescription` |
| `miniStrategiLinkLabel` | `sejarahCardLinkLabel` |
| `miniStrategiLinkHref` | `sejarahCardLinkHref` |

Field rename aman karena `readSiteSettings` merge dengan defaults — record DB lama yang pakai field lama akan diabaikan dan digantikan default baru.

---

## File yang Berubah

1. **`src/db/query/site-settings.ts`**
   - Update `AboutSettings` type: rename `miniStrategi*` → `sejarahCard*`
   - Update `SETTINGS_DEFAULTS.about`: isi ulang dengan konten sejarah + fix `readMoreHref`

2. **`src/app/(main)/_components/about-section/about-section.tsx`**
   - Update field references ke nama baru
   - Ganti markup card kanan: icon kalender, tanggal, heading, deskripsi, link

3. **`src/app/(dashboard)/dashboard/pages/home/_components/about-form/about-form.tsx`**
   - Update label input field agar sesuai konten baru

---

## Tidak Berubah

- Struktur DB / schema (field names di JSON blob, not columns)
- Layout dua-kolom section
- Logika caching dan settings fetch
- Halaman `/tentang` itu sendiri
