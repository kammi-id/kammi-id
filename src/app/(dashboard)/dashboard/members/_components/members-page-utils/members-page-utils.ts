export const getMembersPageLabels = (activeType?: string, currentOrg: any) => {
  const typeLabel =
    activeType === 'pemandu'
      ? 'Data Pemandu'
      : activeType === 'instruktur'
        ? 'Data Instruktur'
        : activeType === 'alumni'
          ? 'Data Alumni'
          : 'Data Kader'

  const typeSubLabel =
    activeType === 'pemandu'
      ? 'pemandu'
      : activeType === 'instruktur'
        ? 'instruktur'
        : activeType === 'alumni'
          ? 'alumni'
          : 'anggota'

  let pageTitle = `${typeLabel} ${currentOrg.name}`
  let subTitle = `Menampilkan jumlah ${typeSubLabel} di bawah ${currentOrg.name}.`
  let nameHeader = 'Nama Organisasi'

  if (currentOrg.type === 'pp') {
    pageTitle = `${typeLabel} se-Indonesia`
    subTitle = `Menampilkan statistik ${typeSubLabel} dari seluruh wilayah dan daerah luar negeri.`
    nameHeader = 'PW/PDLN'
  } else if (currentOrg.type === 'pw') {
    subTitle = `Statistik ${typeSubLabel} di wilayah ${currentOrg.name}.`
    nameHeader = 'PD/PK'
  } else if (currentOrg.type === 'pd') {
    subTitle = `Statistik ${typeSubLabel} di daerah ${currentOrg.name}.`
    nameHeader = 'PK'
  }

  return { pageTitle, subTitle, nameHeader }
}

export const parseMembersSearchParams = (sParams: {
  [key: string]: string | string[] | undefined
}) => {
  const query = typeof sParams.q === 'string' ? sParams.q : undefined
  const page =
    typeof sParams.page === 'string' ? Math.max(1, parseInt(sParams.page)) : 1
  const limit = typeof sParams.size === 'string' ? parseInt(sParams.size) : 10
  const offset = (page - 1) * limit

  let orderBy: { column: string; direction: 'asc' | 'desc' }[] | undefined
  if (typeof sParams.sort === 'string') {
    const [col, dir] = sParams.sort.split('.')
    if (col && (dir === 'asc' || dir === 'desc')) {
      orderBy = [{ column: col, direction: dir }]
    }
  }

  const mQuery = typeof sParams.mq === 'string' ? sParams.mq : undefined
  const mPage =
    typeof sParams.mpage === 'string' ? Math.max(1, parseInt(sParams.mpage)) : 1
  const mLimit =
    typeof sParams.msize === 'string' ? parseInt(sParams.msize) : 10
  const mOffset = (mPage - 1) * mLimit

  return {
    summary: { query, page, limit, offset, orderBy },
    individuals: { mQuery, mPage, mLimit, mOffset }
  }
}
