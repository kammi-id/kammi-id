import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'bun:test' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<R = void, T = {}> extends TestingLibraryMatchers<
    typeof expect.stringContaining,
    R
  > {}
}
