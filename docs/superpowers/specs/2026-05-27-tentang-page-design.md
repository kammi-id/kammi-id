# Design Spec: Halaman /tentang

**Date:** 2026-05-27
**Status:** Confirmed
**Register:** Brand

---

## 1. Feature Summary

Halaman `/tentang` adalah pernyataan identitas publik KAMMI — perjalanan museum-like melalui 8 ruangan ideologis dan historis. Halaman ini melayani tiga tipe visitor (calon anggota, publik umum, anggota existing) dengan satu pendekatan: setiap orang keluar dengan rasa hormat terhadap kedalaman intelektual dan moral organisasi. Ini bukan halaman informasi biasa — ini sebuah artefak.

---

## 2. Primary User Action

Berjalan melewati identitas KAMMI dari sejarah hingga kredo, dan keluar dengan pemahaman yang utuh tentang siapa KAMMI dan apa yang diperjuangkannya.

---

## 3. Design Direction

**Color strategy:** Art direction per section — tiap ruangan punya tone sendiri, diikat oleh tipografi konsisten dan motif crimson sebagai benang merah.

**Scene sentence:** Mahasiswa membuka /tentang malam hari di laptop, sedang riset sebelum memutuskan bergabung — mereka butuh merasakan berat dan tujuan organisasi, bukan sekadar membaca teks berjejer.

**Named anchor references:**
- **NMAAHC (National Museum of African American History)** — perjalanan imersif lantai-per-lantai, ada berat dan reverens
- **Stripe.com/about** — tipografi premium, pacing yang sabar dan deliberate
- **US Constitution formatting** — khusus section Kredo: presisi, kewenangan, tak terbantahkan

---

## 4. Scope

- **Fidelity:** Production-ready
- **Breadth:** Full `/tentang` page — Hero + 8 sections + sticky nav
- **Interactivity:** Lenis smooth scroll (global) + GSAP ScrollTrigger reveals + GSAP horizontal pin untuk Kredo
- **Time intent:** Polish sampai siap ship. Konten placeholder; akan diisi kemudian.

---

## 5. Layout Strategy

### Page Structure

9 slot total (1 hero + 8 section):

| Slot | Section | Background | Visual Treatment |
|------|---------|------------|-----------------|
| Hero | Title Card | White | Judul `clamp(4rem,10vw,9rem)`, 1 kalimat framing, animated scroll cue |
| 1 | Sejarah Singkat | Cream `oklch(0.97 0.01 60)` | Archival, text-forward, typographic |
| 2 | Visi KAMMI | Crimson drench (`--primary`) | Single bold statement, white text, no noise |
| 3 | Misi KAMMI (5 item) | Near-black `oklch(0.14 0.005 285)` | Large numerals, stagger reveal per scroll |
| 4 | Karakteristik (2 item) | White/soft | Dua kolom tipografis, generous whitespace |
| 5 | Unsur Gerakan (4 item) | Warm cream | Quadrant layout, large numeral anchor |
| 6 | Prinsip (6 item) | Deep slate `oklch(0.18 0.008 285)` | 2×3 grid, text-only, no icons |
| 7 | Paradigma (4 item) | White + crimson accent | 4 statement tipografis besar |
| 8 | Kredo (6 artikel) | Near-black `oklch(0.12 0.005 285)` | GSAP horizontal pin, 6 constitutional panels |

### Section Numbering

Tiap section (1–8) menampilkan super-large muted section number di background sebagai anchor visual dan sense of place.

### Sticky Section Nav

- Tampil di semua section (1–8), tersembunyi di Hero
- Posisi: sisi kanan viewport, vertical center
- Berupa vertical dots (8 titik kecil, satu per section) — active state: dot membesar + fill crimson
- Section label muncul saat hover atau active
- Smooth scroll ke section saat diklik

---

## 6. Key States

| State | Behavior |
|-------|---------|
| Default | Semua section render, Lenis + GSAP aktif |
| Reduced motion | `prefers-reduced-motion`: semua GSAP animations off, konten tetap fully readable tanpa motion |
| Mobile | Kredo horizontal pin collapse → vertical scroll biasa; layout responsif per section |
| Loading | RSC content-first, animasi adalah progressive enhancement (tidak block render) |
| Long Kredo text | Panel accommodate overflow gracefully dengan scrollable area internal |

---

## 7. Interaction Model

### Lenis (Global Smooth Scroll)

- Provider di `src/app/(main)/layout.tsx`
- Akan digunakan oleh halaman lain di `(main)` nantinya
- Lenis RAF di-sync dengan GSAP ticker untuk kompatibilitas ScrollTrigger

### GSAP ScrollTrigger per Section

| Section | GSAP Behavior |
|---------|--------------|
| Hero | Scroll cue animasi loop (chevron/arrow bounce) |
| Sejarah | Text lines fade + slide up saat enter viewport |
| Visi | Heading scale-up saat pin, hold selama user pause |
| Misi | Tiap item stagger masuk sequential (`scrub: true`) |
| Karakteristik | Dua kolom slide dari sisi berlawanan |
| Unsur | Quadrant reveal dari center outward |
| Prinsip | Grid items cascade masuk |
| Paradigma | Statements snap-reveal satu per satu |
| Kredo | **Horizontal pin**: scroll vertikal → gerak horizontal. 6 panel berurutan seperti membuka lembar konstitusi |

### Kredo Horizontal Scroll Detail

- Section di-pin saat reach viewport
- Total width = 6 × 100vw (satu panel per viewport width)
- Scroll distance = cukup untuk melewati semua 6 panel
- Tiap panel: nomor Romawi (I–VI), judul kredo, body text
- Mobile fallback: no pin, scroll vertikal biasa

---

## 8. Content Requirements

### Hero

- Heading: "Tentang KAMMI" (display, `clamp(4rem,10vw,9rem)`)
- Subheading: 1 kalimat framing tentang apa yang akan ditemukan di halaman ini
- Scroll cue: animated indicator

### Section 1–7

Tiap section memerlukan:
- Heading section (dari data aktual atau placeholder yang realistis)
- Konten utama sesuai jumlah item (5 misi, 2 karakteristik, dst)
- Konten akan diisi kemudian oleh user

### Section 8 — Kredo

6 panel, tiap panel:
- Nomor Romawi (I, II, III, IV, V, VI)
- Judul kredo (pendek, authoritative)
- Body text panjang (artikel level, konstitusional tone)

Semua copy: placeholder realistis (bukan lorem ipsum), akan diperbarui kemudian.

---

## 9. Technical Notes

### Dependencies

- `gsap` + `@gsap/react` — sudah terinstall (`^3.15.0`, `^2.1.2`)
- `lenis` — **perlu diinstall** (`bun add lenis`)

### Component Architecture

```
src/app/(main)/
  layout.tsx                    ← Tambah LenisProvider di sini
  tentang/
    page.tsx                    ← RSC, compose semua sections
    _components/
      tentang-hero/
      sejarah-section/
      visi-section/
      misi-section/
      karakteristik-section/
      unsur-section/
      prinsip-section/
      paradigma-section/
      kredo-section/            ← client component (GSAP horizontal)
      section-nav/              ← sticky nav, client component
```

### RSC Strategy

- Semua section adalah RSC kecuali yang memerlukan GSAP (`kredo-section`, `section-nav`)
- GSAP animations di-attach via `useGSAP` hook di client leaf components
- Lenis provider adalah `use client` wrapper minimal

### Reduced Motion

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!prefersReducedMotion) {
  // init GSAP animations
}
```

---

## 10. Recommended References

- `motion-design.md` — GSAP ScrollTrigger + Lenis integration patterns
- `spatial-design.md` — 9-slot rhythm, section spacing system
- `typography.md` — multi-room type hierarchy (display → body → label)
- `responsive-design.md` — horizontal Kredo → vertical mobile fallback

---

## 11. Anti-Goals

- Bukan halaman info biasa dengan card grid seragam
- Bukan accordion untuk Kredo (sudah diputuskan: horizontal scroll)
- Bukan satu tone warna saja (sudah diputuskan: art direction per section)
- Tidak ada gradient text, glassmorphism dekoratif, atau side-stripe borders
- Bukan template SaaS landing page — harus terasa seperti artefak yang dirancang dengan intention
