/**
 * Tipe dan batas ukuran unggahan gambar yang dipakai bersama klien dan
 * server. Satu sumber kebenaran supaya atribut `accept` di tiap input file
 * dan pemeriksaan ukuran di klien tidak diam-diam menyimpang dari batas yang
 * sungguh ditegakkan `uploadImageAction` — lihat
 * `.scratch/berita-polish/issues/03-unggah-gambar-gagal-diam-diam.md`.
 *
 * Tidak ada arahan `'use client'`/`'use server'` di sini dengan sengaja:
 * berkas ini cuma konstanta murni, jadi aman diimpor dari komponen klien
 * maupun `src/lib/actions/storage.ts` yang `'use server'`.
 */
export const ACCEPTED_IMAGE_MIME_TYPES =
  'image/jpeg,image/png,image/webp,image/heic,image/heif'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
