/**
 * Masa Penetapan Kelulusan — rentang waktu Kelulusan sebuah Daurah boleh
 * ditetapkan atau diubah. Terbuka sehari setelah Daurah selesai, tertutup
 * `MASA_HARI` hari sesudahnya.
 *
 * Root menembus kedua sisinya, bukan hanya sisi penutupnya: ia kewenangan
 * pemulih keadaan, dan koreksi data yang terlanjur salah tidak mengenal arah
 * waktu. Pengecualian itu bagian dari definisi masanya, jadi ia hidup di sini
 * — bukan di setiap pemanggil.
 *
 * Modul ini murni: tidak membaca sesi, tidak menyentuh basis data. Pemanggil
 * yang menyediakan `endDate` Daurah dan Kewenangan pemakainya.
 */

const MASA_HARI = 30
const SEHARI_MS = 1000 * 60 * 60 * 24

export type AlasanTertutup = 'belum-selesai' | 'terlampaui'

export type MasaPenetapan =
  | { terbuka: true; batasAkhir: Date | null }
  | { terbuka: false; alasan: AlasanTertutup; batasAkhir: null }

export const masaPenetapanKelulusan = ({
  endDate,
  role,
  now = new Date()
}: {
  endDate: string
  role: string
  now?: Date
}): MasaPenetapan => {
  const akhir = new Date(endDate)
  const hariIni = new Date(now)
  hariIni.setHours(0, 0, 0, 0)

  const sudahSelesai = hariIni > akhir
  // Batas akhir hanya bermakna setelah Daurah selesai; selama masih berlangsung
  // belum ada tenggat untuk ditampilkan.
  const batasAkhir = sudahSelesai
    ? new Date(akhir.getTime() + MASA_HARI * SEHARI_MS)
    : null

  if (role === 'root') return { terbuka: true, batasAkhir }

  if (!sudahSelesai)
    return { terbuka: false, alasan: 'belum-selesai', batasAkhir: null }

  const hariSejakSelesai = Math.floor(
    (hariIni.getTime() - akhir.getTime()) / SEHARI_MS
  )
  if (hariSejakSelesai > MASA_HARI)
    return { terbuka: false, alasan: 'terlampaui', batasAkhir: null }

  return { terbuka: true, batasAkhir }
}
