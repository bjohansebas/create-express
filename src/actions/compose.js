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
import { supportsNativeTypeStripping } from '../utils/node.js'
import { toCommonJs } from '../utils/to-cjs.js'

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

const VIEW_EXTENSIONS = { ejs: '.ejs', pug: '.pug', handlebars: '.hbs' }

/**
 * An example may ship a view template in every engine's syntax (e.g. mvc's
 * `users` view); keep only the one matching the chosen engine.
 */
function pruneViewTemplates(cwd, context) {
  const keep = VIEW_EXTENSIONS[context.view]
  if (!keep) {
    return
  }

  const viewsDir = join(cwd, 'views')
  for (const entry of readdirSync(viewsDir)) {
    if (extname(entry) !== keep) {
      rmSync(join(viewsDir, entry))
    }
  }
}

/**
 * The ESLint fragment ships a JavaScript and a TypeScript config; keep the one
 * matching the project language as `eslint.config.js`.
 */
function selectEslintConfig(cwd, context) {
  if (context.linter !== 'eslint') {
    return
  }

  const keep = context.typescript ? 'typescript' : 'javascript'
  const drop = context.typescript ? 'javascript' : 'typescript'
  rmSync(join(cwd, `${drop}.js`), { force: true })
  renameSync(join(cwd, `${keep}.js`), join(cwd, 'eslint.config.js'))
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

/**
 * Rewrite every source file to CommonJS and adjust tsconfig.json. The
 * package.json `type` field is dropped by the caller.
 */
function applyCommonJs(dir, context) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)

    if (statSync(path).isDirectory()) {
      applyCommonJs(path, context)
      continue
    }

    // Vitest runs its test files through Vite (ESM) and imports the CommonJS
    // app via interop, so the test stays as-is.
    if (context.test === 'vitest' && (entry === 'app.test.js' || entry === 'app.test.ts')) {
      continue
    }

    const ext = extname(entry)
    if (ext === '.js' || ext === '.ts') {
      writeFileSync(path, toCommonJs(readFileSync(path, 'utf-8'), ext === '.ts'))
    } else if (entry === 'tsconfig.json') {
      // String edits (not JSON round-trip) to preserve the formatting linters expect.
      const tsconfig = readFileSync(path, 'utf-8')
        .replace('"module": "NodeNext"', '"module": "commonjs"')
        .replace('"moduleResolution": "NodeNext"', '"moduleResolution": "node"')
        .replace(/ *"allowImportingTsExtensions": true,\n/, '')
        .replace(/ *"rewriteRelativeImportExtensions": true,\n/, '')
      writeFileSync(path, tsconfig)
    }
  }
}

/**
 * TypeScript test files can't be run by `node --test`/mocha directly (native
 * type-stripping doesn't transpile `import` in CommonJS, and not at all for
 * older runners), so route them through tsx — uniformly for ESM and CommonJS.
 */
function useTsxForTests(manifest, context) {
  if (!context.typescript || !manifest.scripts) {
    return
  }

  if (context.test === 'node') {
    manifest.scripts.test = 'node --import tsx --test'
    manifest.scripts['test:watch'] = 'node --import tsx --test --watch'
  } else if (context.test === 'mocha') {
    manifest.scripts.test = 'mocha --node-option import=tsx'
    manifest.scripts['test:watch'] = 'mocha --node-option import=tsx --watch'
  }
}

/**
 * Use Node's native `--watch` for the TypeScript dev script when the running
 * Node can strip types (>=22.18) — but only for ESM, since a CommonJS `.ts`
 * keeps `import`, which native stripping won't transpile. Drop `tsx` when
 * neither the dev script nor the test runner needs it.
 */
function useNativeTsWatch(manifest, context) {
  if (!context.typescript || !manifest.scripts) {
    return
  }

  const native = context.module !== 'cjs' && supportsNativeTypeStripping(process.versions.node)
  if (native) {
    manifest.scripts.dev = 'node --watch server.ts'
  }

  const tsxNeeded = !native || context.test === 'node' || context.test === 'mocha'
  if (!tsxNeeded && manifest.devDependencies) {
    delete manifest.devDependencies.tsx
  }
}

/**
 * Build a README describing how to run the generated project, using the chosen
 * package manager and whatever scripts the project ended up with.
 */
function readme(context, manifest) {
  const pm = context.packageManager
  const run = pm === 'npm' ? 'npm run' : pm

  const lines = [
    `# ${context.projectName}`,
    '',
    'An [Express](https://expressjs.com) app.',
    '',
    '## Getting started',
    '',
    'Install dependencies and start the development server:',
    '',
    '```sh',
    `${pm} install`,
    `${run} dev`,
    '```',
    '',
    'The server listens on http://localhost:3000 — set the `PORT` environment variable to change it.',
    '',
    '## Scripts',
    '',
    '| Command | Runs |',
    '| --- | --- |',
  ]

  for (const [name, command] of Object.entries(manifest.scripts)) {
    lines.push(`| \`${run} ${name}\` | \`${command}\` |`)
  }

  return `${lines.join('\n')}\n`
}

function describe(context) {
  const parts = [
    context.example ?? 'minimal',
    context.typescript ? 'TypeScript' : 'JavaScript',
    context.module === 'cjs' ? 'CommonJS' : 'ESM',
  ]
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
  selectEslintConfig(context.cwd, context)
  pruneViewTemplates(context.cwd, context)

  if (context.module === 'cjs') {
    applyCommonJs(context.cwd, context)
  }

  // A JavaScript project has no use for `@types/*` packages that fragments may
  // declare for their TypeScript variant.
  if (!context.typescript && pkg.value.devDependencies) {
    for (const dep of Object.keys(pkg.value.devDependencies)) {
      // `@types/*` and typescript-eslint are TypeScript-only tooling.
      if (dep.startsWith('@types/') || dep === 'typescript-eslint') {
        delete pkg.value.devDependencies[dep]
      }
    }
    if (Object.keys(pkg.value.devDependencies).length === 0) {
      delete pkg.value.devDependencies
    }
  }

  useTsxForTests(pkg.value, context)
  useNativeTsWatch(pkg.value, context)

  const manifest = sortDependencies(pkg.value)
  if (context.module === 'cjs') {
    delete manifest.type
  }
  manifest.name = context.projectName

  // Pin the project to the Node version used to scaffold it.
  manifest.devEngines = {
    runtime: { name: 'node', version: `>=${process.versions.node}`, onFail: 'warn' },
  }

  writeFileSync(join(context.cwd, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(context.cwd, '.nvmrc'), `${process.versions.node}\n`)
  writeFileSync(join(context.cwd, 'README.md'), readme(context, manifest))

  console.log('Success!', `Project created (${describe(context)})`)
}
