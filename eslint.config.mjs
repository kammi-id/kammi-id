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
  // Cross-route imports: a component folder is reached through its barrel and
  // nothing else. Relative and aliased spellings are the same violation — an
  // earlier audit missed three of five reach-ins by searching relative paths
  // only. See the Codebase Organization section of AGENTS.md.
  //
  // The relative pattern is deliberately over-strict: it also forbids a route
  // deep-importing its own folder, which is not harmful in itself, but a glob
  // cannot tell a route's own directory from another's and ownership-aware
  // matching would need real path resolution.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/_components/*/*'],
              message:
                'Import the component through its folder barrel, not a file inside it.'
            },
            {
              // `shadcn/` is CLI-generated and exempt outright. `base-ui/` and
              // `ui/` are grouping folders, so one level inside them still
              // lands on a component's own barrel — but only one level. A path
              // deeper than that reaches past that barrel and is re-banned
              // below.
              group: [
                '~/components/*/*',
                '!~/components/shadcn/**',
                '!~/components/base-ui/*',
                '!~/components/ui/*'
              ],
              message:
                'Import the component through its folder barrel, not a file inside it.'
            },
            {
              group: [
                '~/components/base-ui/*/*',
                '~/components/ui/*/*',
                '!~/components/shadcn/**'
              ],
              message:
                'Import the component through its folder barrel, not a file inside it.'
            }
          ]
        }
      ]
    }
  },
  // TODO: Address these as part of ongoing code quality improvements.
  // These rules flag widespread pre-existing patterns in the codebase.
  {
    plugins: { 'react-hooks': reactHooks },
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
