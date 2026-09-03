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

/**
 * Names that state a file's role and nothing about its domain. `columns` is
 * deliberately absent: the TanStack column-definition file is a sanctioned
 * idiom. See the Filenames section of AGENTS.md.
 */
const ROLE_GENERIC_NAMES = [
  'form',
  'card',
  'list',
  'item',
  'content',
  'wrapper'
]

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
 * constants only) and is exempt from the bare-file and kebab-case rules. The
 * prefix is a claim the script trusts, not one it can verify.
 */
const hasCompanionPrefix = (name: string) => name.startsWith('_')

const isBarrel = (name: string) => name === 'index.ts'

/**
 * A grouping folder holds *only other component folders* — it is not an
 * exported unit, so it needs no barrel. Detected by content, not name, so the
 * rule stays true as the tree grows.
 *
 * Holding no component files is necessary but not sufficient: a folder with no
 * files at all, or one holding only companions like `action.ts`, is not a
 * grouping folder and still owes a barrel.
 */
const isGroupingFolder = (dir: string) =>
  componentFiles(dir).length === 0 && subdirs(dir).length > 0

const stem = (name: string) => name.replace(/\.(tsx|ts)$/, '')

/** Recurse into child folders, checking their names on the way down. */
const checkSubdirs = (dir: string) => {
  for (const child of subdirs(dir)) {
    if (!KEBAB_CASE.test(child)) {
      report(join(dir, child), 'not-kebab-case', 'folder must be kebab-case')
    }
    checkFolder(join(dir, child))
  }
}

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

    // Sibling names are domain-specific, not role-generic: a file stating only
    // its role takes its component's name as a prefix. The implementation file
    // named for its folder is the common case of the same rule, so both are
    // covered by banning the bare role names.
    for (const file of files) {
      if (isBarrel(file) || hasCompanionPrefix(file)) continue
      if (ROLE_GENERIC_NAMES.includes(stem(file))) {
        report(
          join(dir, file),
          'role-generic-name',
          `prefix with the component name (e.g. ${folder}-${stem(file)}); a bare role name means twelve different things in twelve folders`
        )
      }
    }
  }

  for (const file of files) {
    if (isBarrel(file) || hasCompanionPrefix(file)) continue
    if (!KEBAB_CASE.test(stem(file))) {
      report(join(dir, file), 'not-kebab-case', 'filename must be kebab-case')
    }
  }

  checkSubdirs(dir)
}

/**
 * A `_components/` root (and the shared component root) may hold only
 * component folders and side-effect-free `_`-prefixed companions. Anything
 * that *does* something belongs to a component folder.
 */
const checkComponentRoot = (dir: string) => {
  if (isGenerated(dir)) return

  for (const file of componentFiles(dir)) {
    if (hasCompanionPrefix(file)) continue
    report(
      join(dir, file),
      'bare-file-at-root',
      'promote to its own folder with a barrel, or prefix _ if side-effect-free'
    )
  }

  checkSubdirs(dir)
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
