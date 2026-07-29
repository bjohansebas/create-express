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
  _dockerignore: '.dockerignore',
}

const IGNORED_ENTRIES = new Set(['node_modules'])

/**
 * Build the ordered list of template fragments to compose. Order matters:
 * later fragments override files and deep-merge their package.json on top of
 * earlier ones.
 */
function fragmentsFor(context) {
  // typescript and docker go before the example so an example can override
  // their files (e.g. api/mvc replace server.ts and compose.yaml).
  const fragments = ['base']

  if (context.typescript) {
    fragments.push('typescript')
  }
  fragments.push('docker')
  fragments.push(`example/${context.example ?? 'minimal'}`)
  // The web and mvc starters render server-side views; the rest stay JSON-only.
  if (context.example === 'web' || context.example === 'mvc') {
    fragments.push('view/ejs')
  }
  fragments.push('linter/oxlint')
  fragments.push('test/node')

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

/**
 * Examples with a database declare `db:migrate` against `migrate.js`; a
 * TypeScript project runs the `.ts` source directly instead.
 */
function useTypeScriptMigrateScript(manifest, context) {
  if (context.typescript && manifest.scripts?.['db:migrate']) {
    manifest.scripts['db:migrate'] = 'node migrate.ts'
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

/**
 * Build an AGENTS.md so coding agents pick up the project's conventions and
 * the Express docs entry point, tailored to the chosen example and language.
 */
function agentsMd(context, manifest) {
  const ts = context.typescript
  const ext = ts ? 'ts' : 'js'
  const hasDb = context.example === 'api' || context.example === 'mvc'
  const hasViews = context.example === 'web' || context.example === 'mvc'
  const pm = context.packageManager
  const run = pm === 'npm' ? 'npm run' : pm

  const lines = [
    '# AGENTS.md',
    '',
    `An [Express](https://expressjs.com) 5 app: ${context.example ?? 'minimal'} starter, ${ts ? 'TypeScript' : 'JavaScript'}, ESM.`,
    '',
    'Documentation in LLM-friendly form:',
    '',
    '- Express: https://expressjs.com/llms.txt',
    '- Node.js: https://nodejs.org/llms.txt',
    '',
    '## Commands',
    '',
  ]

  for (const [name, command] of Object.entries(manifest.scripts)) {
    lines.push(`- \`${run} ${name}\` — \`${command}\``)
  }

  lines.push(
    '',
    '## Practices',
    '',
    '- ESM only (`"type": "module"`): use `import`/`export`, never `require`.',
  )
  if (ts) {
    lines.push(
      '- Imports use explicit `.ts` extensions; Node runs the sources natively (no transpiler in dev or tests) and `tsc` only builds `dist/`.',
    )
  }
  lines.push(
    `- \`app.${ext}\` builds and exports the Express app; \`server.${ext}\` owns the cluster and boot. Tests import the app, never the server.`,
    '- Lint with oxlint and format with oxfmt (single quotes, no semicolons); run both before finishing a change.',
    `- Tests run on \`node:test\` from \`app.test.${ext}\` — extend it when routes or behavior change.`,
    '- Tests arrange their own data with `@faker-js/faker` through the app surface (routes or services) — never raw SQL in a test.',
    "- Request bodies are validated with zod schemas (`safeParse`) at the route/controller boundary; extend the schema when a route's input changes.",
    '- Security headers come from helmet, registered as the first middleware — tune its options instead of removing it.',
  )
  if (hasDb) {
    lines.push(
      `- SQLite through \`node:sqlite\`: \`db.${ext}\` only opens the connection (\`DB_PATH\`, in-memory by default). Schema changes are new files in \`migrations/\` applied by Umzug — never edit an already-applied migration.`,
    )
  }
  if (hasViews) {
    lines.push('- Server-rendered EJS views live in `views/`; static assets in `public/`.')
  }
  lines.push(
    '- File paths (views, static assets, the database) are cwd-relative: run commands from the project root.',
    '- Node >=24 (the latest LTS, resolved by `.nvmrc` via `lts/*`).',
  )

  return `${lines.join('\n')}\n`
}

function describe(context) {
  const parts = [context.example ?? 'minimal', context.typescript ? 'TypeScript' : 'JavaScript', 'ESM']
  parts.push('oxlint', 'node:test')
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

  useTypeScriptMigrateScript(pkg.value, context)

  const manifest = sortDependencies(pkg.value)
  manifest.name = context.projectName

  // Generated projects rely on the current LTS line (native TS, node:test).
  // Last key on purpose: oxfmt sorts package.json with devEngines at the end.
  manifest.devEngines = {
    runtime: { name: 'node', version: '>=24.0.0', onFail: 'warn' },
  }

  writeFileSync(join(context.cwd, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  // nvm/fnm resolve `lts/*` to the latest LTS at `nvm use` time.
  writeFileSync(join(context.cwd, '.nvmrc'), 'lts/*\n')
  writeFileSync(join(context.cwd, 'README.md'), readme(context, manifest))
  writeFileSync(join(context.cwd, 'AGENTS.md'), agentsMd(context, manifest))

  console.log('Success!', `Project created (${describe(context)})`)
}
