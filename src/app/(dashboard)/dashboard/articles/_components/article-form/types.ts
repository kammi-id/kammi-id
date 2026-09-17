export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: T
}
