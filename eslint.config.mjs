import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts'
  ]),
  // TODO: Address these as part of ongoing code quality improvements.
  // These rules flag widespread pre-existing patterns in the codebase.
  {
    rules: {
      // `any` is used intentionally in many places — clean up incrementally.
      '@typescript-eslint/no-explicit-any': 'warn',
      // React 19 react-hooks v5 new rules — existing patterns need refactoring.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn'
    }
  }
])

export default eslintConfig
