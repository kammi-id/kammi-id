/**
 * Umur dalam tahun+bulan, dieja Indonesia ("18 tahun, 2 bulan"). `birthDate`
 * nullable — pemanggil memakai `null` sebagai sinyal "jangan render baris
 * ini sama sekali", bukan tampilkan placeholder.
 */
export const formatAge = (birthDate: string | null): string | null => {
  if (!birthDate) return null

  // Diparsing manual dari komponen string, bukan `new Date(birthDate)` —
  // `birthDate` adalah tanggal-saja ISO ("1998-05-12"), dan `new Date` pada
  // string semacam itu diparsing sebagai tengah malam UTC, lalu getter lokal
  // (`getMonth`/`getDate`) bisa menggeser tanggalnya mundur satu hari di
  // zona waktu barat UTC. Parsing manual menghindari jebakan itu sama sekali.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate)
  if (!match) return null

  const birthYear = Number(match[1])
  const birthMonth = Number(match[2]) - 1
  const birthDay = Number(match[3])

  const now = new Date()

  let years = now.getFullYear() - birthYear
  let months = now.getMonth() - birthMonth

  if (now.getDate() < birthDay) {
    months -= 1
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) return null

  return `${years} tahun, ${months} bulan`
}
