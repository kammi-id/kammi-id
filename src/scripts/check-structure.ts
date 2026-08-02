/**
 * Structural convention checker.
 *
 * Checks the filesystem questions a linter cannot answer, because a linter
 * only sees files that exist and cannot see a *missing* barrel:
 *
 *   - every component folder exposes a barrel
 *   - no implementation file is named `index`
 *   - no bare component file sits at a `_components/` root
 *   - filenames are kebab-case
 *
 * Scope is component code only: `src/app/**\/_components/` and
 * `src/components/`. See the Codebase Organization section of AGENTS.md.
 *
 * Pass `--warn` to report findings without failing, which is how this landed
 * before the tree was clean.
 */
import { readdirSync, existsSync } from 'fs'
import { join, basename, relative } from 'path'

const ROOT = join(import.meta.dir, '..', '..')
const SRC = join(ROOT, 'src')
const COMPONENT_ROOT = join(SRC, 'components')

/** CLI-generated trees, exempt from every rule in this script. */
const GENERATED = ['src/components/shadcn', 'src/lib/shadcn']

const COMPONENT_EXT = ['.tsx', '.ts']
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/

type Violation = { path: string; rule: string; detail: string }

const violations: Violation[] = []

const report = (path: string, rule: string, detail: string) => {
  violations.push({ path: relative(ROOT, path), rule, detail })
}

const isGenerated = (dir: string) =>
  GENERATED.some((g) => relative(ROOT, dir).startsWith(g))

const entriesOf = (dir: string) => readdirSync(dir, { withFileTypes: true })

const subdirs = (dir: string) =>
  entriesOf(dir)
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

/** Files that are part of the component surface, ignoring tests and assets. */
const componentFiles = (dir: string) =>
  entriesOf(dir)
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => COMPONENT_EXT.some((ext) => n.endsWith(ext)))
    .filter((n) => !n.includes('.test.'))
    .filter((n) => !n.endsWith('.d.ts'))

/**
 * A `_`-prefixed file is a sanctioned side-effect-free companion (types and
 * constants only) and is exempt from the bare-file and kebab-case rules.
 */
const isSideEffectFree = (name: string) => name.startsWith('_')

const isBarrel = (name: string) => name === 'index.ts'

/**
 * A grouping folder holds only other component folders — it is not an exported
 * unit, so it needs no barrel. Detected by *content, not name*, so the rule
 * stays true as the tree grows.
 */
const isGroupingFolder = (dir: string) =>
  componentFiles(dir).filter((n) => !isSideEffectFree(n)).length === 0

const stem = (name: string) => name.replace(/\.(tsx|ts)$/, '')

const checkFolder = (dir: string) => {
  if (isGenerated(dir)) return

  const files = componentFiles(dir)
  const folder = basename(dir)

  if (!isGroupingFolder(dir)) {
    if (!existsSync(join(dir, 'index.ts'))) {
      report(dir, 'missing-barrel', 'component folder has no index.ts barrel')
    }

    if (existsSync(join(dir, 'index.tsx'))) {
      report(
        join(dir, 'index.tsx'),
        'index-implementation',
        `implementation must be named ${folder}.tsx; index.ts is a barrel only`
      )
    }
  }

  for (const file of files) {
    if (isBarrel(file) || isSideEffectFree(file)) continue
    if (!KEBAB_CASE.test(stem(file))) {
      report(join(dir, file), 'not-kebab-case', 'filename must be kebab-case')
    }
  }

  for (const child of subdirs(dir)) {
    if (!KEBAB_CASE.test(child)) {
      report(join(dir, child), 'not-kebab-case', 'folder must be kebab-case')
    }
    checkFolder(join(dir, child))
  }
}

/**
 * A `_components/` root (and the shared component root) may hold only
 * component folders and side-effect-free `_`-prefixed companions. Anything
 * that *does* something belongs to a component folder.
 */
const checkComponentRoot = (dir: string) => {
  if (isGenerated(dir)) return

  for (const file of componentFiles(dir)) {
    if (isSideEffectFree(file)) continue
    report(
      join(dir, file),
      'bare-file-at-root',
      'promote to its own folder with a barrel, or prefix _ if side-effect-free'
    )
  }

  for (const child of subdirs(dir)) {
    if (!KEBAB_CASE.test(child)) {
      report(join(dir, child), 'not-kebab-case', 'folder must be kebab-case')
    }
    checkFolder(join(dir, child))
  }
}

/** Walk `src/app` collecting every `_components/` directory. */
const findComponentRoots = (dir: string, found: string[] = []) => {
  for (const name of subdirs(dir)) {
    const child = join(dir, name)
    if (name === '_components') found.push(child)
    else findComponentRoots(child, found)
  }
  return found
}

for (const root of findComponentRoots(join(SRC, 'app'))) {
  checkComponentRoot(root)
}
checkComponentRoot(COMPONENT_ROOT)

const warnOnly = process.argv.includes('--warn')

if (violations.length === 0) {
  console.log('check:structure — no violations')
  process.exit(0)
}

const label = warnOnly ? 'warning' : 'error'
for (const v of violations) {
  console.log(`${label}: ${v.path}\n  [${v.rule}] ${v.detail}`)
}
console.log(
  `\n${violations.length} ${label}${violations.length === 1 ? '' : 's'}`
)

process.exit(warnOnly ? 0 : 1)
