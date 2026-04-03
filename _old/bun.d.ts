declare module 'bun' {
  interface Env {
    DATABASE_URL: string
    API_CO_ID_KEY: string
    STORAGE_ENDPOINT: string
    STORAGE_ACCESS_KEY: string
    STORAGE_SECRET_KEY: string
  }
}
