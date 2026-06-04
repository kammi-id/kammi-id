import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'

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
    'next-env.d.ts',
    // Tooling worktrees and local-only directories:
    '.claude/**',
    '.claire/**',
    '.agents/**'
  ]),
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // React 19 react-hooks v5 rules — all violations resolved.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/refs': 'error',
      // All explicit any usage has been cleaned up — enforce strict typing.
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  // Shadcn UI generated files are exempt from strict typing rules.
  {
    files: ['src/components/shadcn/**', 'src/lib/shadcn/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])

export default eslintConfig
