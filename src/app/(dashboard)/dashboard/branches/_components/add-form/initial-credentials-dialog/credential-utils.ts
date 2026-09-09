export type InitialCredential = {
  authority: string
  username: string
  password: string
}

const escapeCsvField = (value: string) => {
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safeValue)
    ? `"${safeValue.replaceAll('"', '""')}"`
    : safeValue
}

export const credentialsToText = (credentials: InitialCredential[]) =>
  credentials
    .map(
      ({ authority, username, password }) =>
        `${authority}\nUsername: ${username}\nPassword: ${password}`
    )
    .join('\n\n')

export const credentialsToCsv = (credentials: InitialCredential[]) =>
  [
    ['Kewenangan', 'Username', 'Password'],
    ...credentials.map(({ authority, username, password }) => [
      authority,
      username,
      password
    ])
  ]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\r\n') + '\r\n'

export const sanitizeCredentialFilename = (slug: string) => {
  const safeSlug = slug
    .normalize('NFKD')
    .replace(/\.[^.]*$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `kredensial-${safeSlug || 'struktur'}.csv`
}

export const downloadCredentialsCsv = (
  credentials: InitialCredential[],
  slug: string
) => {
  const blob = new Blob([credentialsToCsv(credentials)], {
    type: 'text/csv;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sanitizeCredentialFilename(slug)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
