import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deepMerge, sortDependencies } from '../utils/merge.js'

const TEMPLATES_DIR = fileURLToPath(new URL('../../templates', import.meta.url))

// Files shipped with a leading underscore so they aren't interpreted while the
// fragment lives inside this package; they are restored on copy.
const RENAME_FILES = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

const IGNORED_ENTRIES = new Set(['node_modules'])

/**
 * Build the ordered list of template fragments to compose. Order matters:
 * later fragments override files and deep-merge their package.json on top of
 * earlier ones.
 */
function fragmentsFor(context) {
  const fragments = ['base', `example/${context.example ?? 'minimal'}`]

  if (context.typescript) {
    fragments.push('typescript')
  }
  if (context.view && context.view !== 'none') {
    fragments.push(`view/${context.view}`)
  }
  if (context.linter && context.linter !== 'none') {
    fragments.push(`linter/${context.linter}`)
  }
  if (context.test && context.test !== 'none') {
    fragments.push(`test/${context.test}`)
  }

  return fragments
}

function applyFragment(srcDir, destDir, pkg) {
  for (const entry of readdirSync(srcDir)) {
    if (IGNORED_ENTRIES.has(entry)) {
      continue
    }

    const srcPath = join(srcDir, entry)

    if (statSync(srcPath).isDirectory()) {
      const nested = join(destDir, entry)
      mkdirSync(nested, { recursive: true })
      applyFragment(srcPath, nested, pkg)
      continue
    }

    // package.json is never copied as-is; every fragment's manifest is merged.
    if (entry === 'package.json') {
      pkg.value = deepMerge(pkg.value, JSON.parse(readFileSync(srcPath, 'utf-8')))
      continue
    }

    copyFileSync(srcPath, join(destDir, RENAME_FILES[entry] ?? entry))
  }
}

/**
 * Resolve the JS/TS split: a TypeScript project drops any `.js` that has a
 * `.ts` sibling, while a JavaScript project drops every `.ts`/`.tsx` file.
 */
function consolidateLanguage(dir, typescript) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)

    if (statSync(path).isDirectory()) {
      consolidateLanguage(path, typescript)
      continue
    }

    const ext = extname(entry)

    if (typescript) {
      if (ext === '.js' && existsSync(join(dir, `${entry.slice(0, -3)}.ts`))) {
        rmSync(path)
      }
    } else if (ext === '.ts' || ext === '.tsx' || entry === 'tsconfig.json') {
      rmSync(path)
    }
  }
}

/**
 * Test runner fragments ship one test per example under `tests/`. Promote the
 * one matching the chosen example to `app.test.<ext>` and drop the rest.
 */
function selectExampleTest(cwd, context) {
  const testsDir = join(cwd, 'tests')
  if (!existsSync(testsDir)) {
    return
  }

  // Every runner ships a test for every example, so this is always present.
  const ext = context.typescript ? 'ts' : 'js'
  renameSync(join(testsDir, `${context.example ?? 'minimal'}.test.${ext}`), join(cwd, `app.test.${ext}`))
  rmSync(testsDir, { recursive: true, force: true })
}

function describe(context) {
  const parts = [context.example ?? 'minimal', context.typescript ? 'TypeScript' : 'JavaScript']
  if (context.view && context.view !== 'none') parts.push(`${context.view} views`)
  if (context.linter && context.linter !== 'none') parts.push(context.linter)
  if (context.test && context.test !== 'none') parts.push(context.test)
  return parts.join(', ')
}

export default async function composeAction(context) {
  mkdirSync(context.cwd, { recursive: true })

  const pkg = { value: {} }

  for (const fragment of fragmentsFor(context)) {
    const srcDir = join(TEMPLATES_DIR, fragment)
    if (!existsSync(srcDir)) {
      throw new Error(`Template fragment "${fragment}" does not exist.`)
    }
    applyFragment(srcDir, context.cwd, pkg)
  }

  consolidateLanguage(context.cwd, context.typescript)
  selectExampleTest(context.cwd, context)

  // A JavaScript project has no use for `@types/*` packages that fragments may
  // declare for their TypeScript variant.
  if (!context.typescript && pkg.value.devDependencies) {
    for (const dep of Object.keys(pkg.value.devDependencies)) {
      if (dep.startsWith('@types/')) {
        delete pkg.value.devDependencies[dep]
      }
    }
    if (Object.keys(pkg.value.devDependencies).length === 0) {
      delete pkg.value.devDependencies
    }
  }

  const manifest = sortDependencies(pkg.value)
  manifest.name = context.projectName
  writeFileSync(join(context.cwd, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  console.log('Success!', `Project created (${describe(context)})`)
}
