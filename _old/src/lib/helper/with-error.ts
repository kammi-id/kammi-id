/**
 * Wraps a promise to return a tuple of [Error, undefined] or [undefined, Data].
 * This pattern avoids try/catch blocks in the calling code and provides a consistent
 * error handling interface across the application.
 *
 * @param promise - The promise to be wrapped.
 * @returns A promise resolving to either an error instance or the successful data.
 *
 * @example
 * ```ts
 * const [error, data] = await withError(someAsyncFunction())
 * if (error) { ... handle error ... }
 * ```
 */
export const withError = async <Data>(
  promise: Promise<Data>
): WithError<Data> => {
  try {
    const data = await promise
    return [undefined, data]
  } catch (error) {
    return [
      error instanceof Error ? error : new Error(String(error)),
      undefined
    ]
  }
}

/**
 * Result type for the withError helper.
 */
export type WithError<Data> = Promise<[Error, undefined] | [undefined, Data]>
