import 'server-only'

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Make sure it is defined in .env.local (development) or set as a runtime env var (production).`
    )
  }
  return value
}

export const S3_ENDPOINT = requireEnv('S3_ENDPOINT')
export const S3_ACCESS_KEY = requireEnv('S3_ACCESS_KEY')
export const S3_SECRET_KEY = requireEnv('S3_SECRET_KEY')
export const S3_BUCKET_NAME = requireEnv('S3_BUCKET_NAME')
export const S3_REGION = process.env.S3_REGION || 'us-east-1'
