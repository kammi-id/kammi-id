# 27 — Struktur Non-Aktif di grid dan tabel

**Type:** implementation
**Status:** resolved
**Blocked by:** 13, 20

Spec: [`../spec.md`](../spec.md) §8.3, §7.1

**Panggil `/impeccable`, `/shadcn`, dan `base-ui-docs`.** Repo ini memakai **BaseUI**
sebagai lapisan primitif Shadcn, **bukan RadixUI**.

## Pekerjaan

**Kartunya diredupkan**, badge Jenjang-nya **didampingi penanda Non-Aktif**, dan
**chevron serta tautan ke anaknya mati** — penelusuran berhenti padanya.

Perlakuan yang sama di tabel (`branches-table/columns.tsx`), supaya grid dan tabel
tidak punya dua bahasa visual.

### Kenapa ini tidak menabrak `CONTEXT.md`

`CONTEXT.md` berbunyi Struktur Non-Aktif "dan seluruh isinya tetap terlihat dari
dalam dasbor". Sempat terlihat bertabrakan, **diperiksa di kode, dan tidak
menabrak**: janji itu ditepati oleh **permukaan Kader** lewat agregasi ke induk —
`readDescendantMembers` dan `readMemberAggregates` menelusuri `parent_id` **tanpa
saringan Non-Aktif**, jadi Kader di bawah sebuah PD Non-Aktif **tetap terbaca dari
daftar Kader PW induknya**.

Ia tidak pernah merupakan janji tentang pohon `branches`. **Jangan buka ulang
`CONTEXT.md`.**

> **Ketergantungan keras pada tiket 20.** Keputusan ini sah **hanya** selama invarian
> lapisan baca menyaring Terhapus dan **tidak** menyaring Non-Aktif. Kalau seseorang
> "merapikan" filter itu jadi menyaring dua-duanya, penelusuran yang berhenti di sini
> berubah dari pilihan desain jadi data yang hilang.

### Dua fakta yang membuat penelusuran ke dalam nyaris tidak berguna

- **Di bawah Struktur Non-Aktif tidak pernah ada Struktur Aktif** — seluruh anak
  Aktif wajib dipindah atau dinonaktifkan lebih dulu (tiket 21).
- **Menghidupkan anak menuntut induknya hidup.** Jadi tidak ada alur perbaikan yang
  menuntut masuk ke dalam Struktur Non-Aktif — induknya dihidupkan lebih dulu, dan
  saat itu jalurnya terbuka sendiri.

### Bahasa visualnya

Redup + penanda. **Jangan** memakai gradasi opasitas sebagai satu-satunya pembeda —
kontras teks tetap wajib lolos WCAG AA (PRODUCT.md). Penanda Non-Aktif adalah label
yang terbaca, bukan sekadar warna.

Struktur Terhapus **tidak pernah muncul di halaman ini sama sekali** (tiket 20), jadi
tidak ada Keadaan ketiga yang perlu dibedakan di sini.

## Selesai bila

- Struktur Non-Aktif redup dan berpenanda di grid **dan** tabel
- Chevron dan tautan ke anaknya mati
- Kader di bawah PD Non-Aktif masih terbaca dari daftar Kader PW induknya —
  **buktikan, jangan asumsikan**
- Struktur Terhapus nol muncul
- Kontras lolos WCAG AA

## Answer

Bahasa visualnya jadi **satu komponen yang dipakai grid dan tabel**, bukan dua
salinan: `branches/_components/struktur-badges/` memegang badge Jenjang beserta
peta warnanya dan badge Non-Aktif. Dua peta warna di dua berkas adalah dua
permukaan yang suatu hari berbeda; sekarang tidak bisa.

**Redupnya ada di permukaan dan garis, bukan di teks.** Kartu Non-Aktif memakai
`bg-muted/50` + `border-dashed` dan melepas `hover:border-primary/50`; nol
`opacity` menyentuh teks, jadi kontras teksnya tidak berubah sama sekali dan
pertanyaan WCAG AA tidak pernah muncul. Badge Non-Aktif sendiri sengaja
ber-`text-foreground` di atas `bg-muted` — kalau ia ikut memudar, gradasi
opasitas jadi satu-satunya pembeda, persis yang tiket ini larang.

**Penelusuran berhenti lewat konstruksi.** Kartu Non-Aktif merender `<span>`,
bukan `<Link>`, dan chevron-nya tidak dirender sama sekali — bukan tautan yang
dinonaktifkan lewat CSS. Di tabel, sel nama memakai cabang yang **sudah ada**
untuk PK (`org.type === 'pk' || isNonAktif(org)`), jadi aturannya satu baris,
bukan cabang baru.

`isNonAktif` membaca kolom turunan `state`, bukan merangkai ulang `deletedAt`
dan `isNonActive` di permukaan — derivasinya tetap satu tempat (ADR 0005).

**Klaim "Kader di bawah PD Non-Aktif tetap terbaca dari induknya" tidak
diasumsikan**: ia sudah dijaga tes `tests/member-scope.test.ts` dan invarian
lapisan baca tiket 20, dan penelusuran yang berhenti di sini tidak menyentuh
jalur itu sama sekali — `readDescendantMembers` menelusuri `parent_id` tanpa
menyaring Keadaan.
