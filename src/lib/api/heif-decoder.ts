import sharp from 'sharp'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])

/**
 * Foto HEIC 16x16 (HEVC, diekspor lewat `sips` macOS) dipakai untuk membuktikan
 * decoder HEIF sungguhan tersedia, bukan cuma terdaftar. `sharp.format.heif`
 * melaporkan `input: true` di macOS maupun di image `oven/bun:1.4.0-slim`
 * sekalipun decode HEVC-nya gagal — flag itu cuma menandai kontainer HEIF
 * terdaftar (dipakai bersama AVIF), bukan codec HEVC tersedia. Hanya
 * percobaan decode sungguhan yang jujur.
 *
 * Ukurannya sengaja kecil tapi tidak seminimal mungkin: fixture 4x4 pernah
 * membuat percobaan decode ini hang alih-alih melempar error saat decoder-nya
 * absen — 16x16 terbukti gagal cepat dan bersih di kedua lingkungan yang
 * diuji.
 */
const HEIC_PROBE_FIXTURE_BASE64 =
  'AAAAJGZ0eXBoZWljAAAAAG1pZjFNaVBybWlhZk1pSEJoZWljAAABw21ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAHBpY3QAAAAAAAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAADnBpdG0AAAAAAAEAAAA4aWluZgAAAAAAAgAAABVpbmZlAgAAAAABAABodmMxAAAAABVpbmZlAgAAAQACAABFeGlmAAAAABppcmVmAAAAAAAAAA5jZHNjAAIAAQABAAAA5mlwcnAAAADFaXBjbwAAABNjb2xybmNseAACAAIABoAAAAAMY2xsaQDLAEAAAAAUaXNwZQAAAAAAAAAQAAAAEAAAAAlpcm90AAAAABBwaXhpAAAAAAMICAgAAABxaHZjQwEDcAAAALAAAAAAAB7wAPz9+PgAAAsDoAABABdAAQwB//8DcAAAAwCwAAADAAADAB5wJKEAAQAjQgEBA3AAAAMAsAAAAwAAAwAeoBQgQcCTDOIe5FlU3AgIGAKiAAEACUQBwGFyyEBTJAAAABlpcG1hAAAAAAAAAAEAAQaBAgMFhoQAAAAsaWxvYwAAAABEAAACAAEAAAABAAACPwAAAK8AAgAAAAEAAAH3AAAASAAAAAFtZGF0AAAAAAAAAQcAAAAGRXhpZgAATU0AKgAAAAgABAEGAAMAAAABAAIAAAESAAMAAAABAAEAAAFCAAQAAAABAAACAAFDAAQAAAABAAACAAAAAAAAAACrKAGvoROwGmG1UxXrw1rVoP4nlBgCHfR7QtW0hF7QfMEsi2T0ZsZKEnYz0ppMOpmyMY0d1kEskzKAXH8PvXxbGnUi/+05qPdT956Y3/naqI31q8Vv/7+zQGo/j6uKn6Xh8vCQ1wX+UHTyq9YRVM5ix54Lfx2tM5IkkB5UY9/pKpVeCyhH//Dg3/+cAP/3309l//Wif/4Fv/6gnn0Tjm+0rsnp3J02fDuC2TzY'

/**
 * Mencoba decode fixture HEIC sungguhan sekali dan mencatat satu baris log —
 * dipanggil dari `instrumentation.ts#register` supaya ketersediaan decoder
 * HEIF terlihat di log boot tanpa harus exec ke dalam container. Tidak pernah
 * melempar: kegagalan decode adalah hasil yang sah untuk dicatat, bukan
 * alasan menggagalkan boot.
 */
export const checkHeifDecoderAtBoot = async (): Promise<void> => {
  try {
    await sharp(Buffer.from(HEIC_PROBE_FIXTURE_BASE64, 'base64'))
      .jpeg()
      .toBuffer()
    logger.info(
      'Decoder HEIF tersedia — unggahan HEIC akan dikonversi ke JPEG.'
    )
  } catch (error) {
    logger.warn(
      'Decoder HEIF TIDAK tersedia di build sharp ini — unggahan HEIC akan ditolak dengan pesan yang jelas ke pengguna: {error}',
      { error }
    )
  }
}
