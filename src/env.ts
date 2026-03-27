function requireEnv(key: keyof typeof Bun.env): string {
  const value = Bun.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const env = {
  databaseUrl: requireEnv('DATABASE_URL')
}
