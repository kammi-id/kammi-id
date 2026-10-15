import type { Organization } from '../../../_data/organizations'

const VALID_ORG_TYPES: Organization['type'][] = ['pp', 'pw', 'pdln', 'pd', 'pk']

const TYPE_LABEL: Record<string, string> = {
  pemandu: 'Data Pemandu',
  instruktur: 'Data Instruktur',
  alumni: 'Data Alumni'
}

const TYPE_SUB_LABEL: Record<string, string> = {
  pemandu: 'pemandu',
  instruktur: 'instruktur',
  alumni: 'alumni'
}

export const getMembersPageLabels = (
  currentOrg: Organization,
  activeType?: string
) => {
  const typeLabel = (activeType && TYPE_LABEL[activeType]) || 'Data Kader'
  const typeSubLabel = (activeType && TYPE_SUB_LABEL[activeType]) || 'anggota'

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
  const limit = typeof sParams.size === 'string' ? parseInt(sParams.size) : 12
  const offset = (page - 1) * limit

  const sort = typeof sParams.sort === 'string' ? sParams.sort : 'yearOfEntry'
  const order =
    typeof sParams.order === 'string' &&
    (sParams.order === 'asc' || sParams.order === 'desc')
      ? sParams.order
      : 'desc'

  const status =
    typeof sParams.status === 'string'
      ? sParams.status.split(',')
      : Array.isArray(sParams.status)
        ? sParams.status
        : undefined

  const gender = typeof sParams.gender === 'string' ? sParams.gender : undefined

  const orgType =
    typeof sParams.orgType === 'string'
      ? (sParams.orgType
          .split(',')
          .filter((t) =>
            VALID_ORG_TYPES.includes(t as Organization['type'])
          ) as Organization['type'][])
      : undefined

  const mQuery = typeof sParams.mq === 'string' ? sParams.mq : undefined
  const mPage =
    typeof sParams.mpage === 'string' ? Math.max(1, parseInt(sParams.mpage)) : 1
  const mLimit =
    typeof sParams.msize === 'string' ? parseInt(sParams.msize) : 10
  const mOffset = (mPage - 1) * mLimit

  return {
    summary: { query, page, limit, offset, orgType },
    individuals: {
      mQuery,
      mPage,
      mLimit,
      mOffset,
      sort,
      order,
      status,
      gender
    }
  }
}
