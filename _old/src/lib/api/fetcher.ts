import { cache } from 'react'
import { withError, type WithError } from '~/lib/helper/with-error'

const TOKEN = process.env.API_CO_ID_KEY
const BASE_URL = 'https://use.api.co.id/regional/indonesia/' as const

/**
 * Represents the standard structure of an API response.
 * Handles both success and failure cases with optional paging data for lists.
 */
export type ApiResponse<Data> =
  | {
      is_success: false
      message: string
    }
  | ({
      is_success: true
      message: string
      data: Data
    } & (Data extends any[]
      ? {
          paging: {
            page: number
            size: number
            total_item: number
            total_page: number
          }
        }
      : { paging?: never }))

/**
 * Recursively converts object keys from snake_case to camelCase.
 *
 * @param obj - The object or array to transform.
 * @returns A new object or array with camelCase keys.
 */
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      )
      result[camelKey] = toCamelCase(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

/**
 * Generic API fetcher with caching and error handling.
 *
 * Automatically handles:
 * 1. Filter normalization (camelCase to snake_case for requests).
 * 2. Response normalization (snake_case to camelCase for data).
 * 3. Error wrapping with the `WithError` tuple.
 * 4. React caching and Next.js revalidation tags.
 *
 * @param path - The API endpoint path.
 * @param filters - Optional query parameters in camelCase.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Data] tuple.
 */
export const fetcher = cache(
  async <Data>(
    path: string,
    filters: Record<string, string | number | boolean | undefined> = {}
  ): WithError<Data> => {
    const url = new URL(path, BASE_URL)
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        )
        url.searchParams.append(snakeKey, String(value))
      }
    }

    const [error, res] = await withError(
      fetch(url, {
        headers: {
          'x-api-co-id': TOKEN ?? ''
        },
        cache: 'force-cache',
        next: { tags: [path], revalidate: 31536000 }
      })
    )

    if (error) return [error, undefined]

    const [parseError, body] = await withError(
      res.json() as Promise<ApiResponse<Data>>
    )

    if (parseError) return [parseError, undefined]

    if (!body.is_success) {
      return [new Error(body.message), undefined]
    }

    return [undefined, toCamelCase(body.data)]
  }
)
