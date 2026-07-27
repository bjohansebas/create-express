import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import composeAction from '../src/actions/compose.js'
import { supportsNativeTypeStripping } from '../src/utils/node.js'

const BASE_FRAGMENT = fileURLToPath(new URL('../templates/base', import.meta.url))

function compose(overrides) {
  const cwd = mkdtempSync(join(tmpdir(), 'create-express-compose-'))
  const context = {
    cwd,
    projectName: 'demo',
    typescript: false,
    view: 'none',
    packageManager: 'npm',
    ...overrides,
  }
  return { context, cwd, pkg: () => JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8')) }
}

test('composes a bare JavaScript project', async () => {
  const { context, cwd, pkg } = compose({})
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.js')))
    assert.ok(existsSync(join(cwd, 'server.js')))
    assert.ok(existsSync(join(cwd, '.gitignore')), '_gitignore should be renamed to .gitignore')
    assert.ok(!existsSync(join(cwd, 'app.ts')))
    assert.ok(!existsSync(join(cwd, 'tsconfig.json')))
    assert.ok(existsSync(join(cwd, '.oxlintrc.json')))
    assert.ok(existsSync(join(cwd, '.oxfmtrc.json')))

    const manifest = pkg()
    assert.equal(manifest.name, 'demo')
    assert.deepEqual(Object.keys(manifest.dependencies), ['express'])
    assert.equal(manifest.scripts.dev, 'node --watch server.js')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('composes a full TypeScript project (ejs)', async () => {
  const { context, cwd, pkg } = compose({
    typescript: true,
    view: 'ejs',
  })
  try {
    await composeAction(context)

    // TS wins over JS where both exist.
    assert.ok(existsSync(join(cwd, 'app.ts')))
    assert.ok(existsSync(join(cwd, 'server.ts')))
    assert.ok(!existsSync(join(cwd, 'app.js')), 'app.js must be dropped in a TS project')
    assert.ok(!existsSync(join(cwd, 'server.js')))

    assert.ok(existsSync(join(cwd, 'tsconfig.json')))
    assert.ok(existsSync(join(cwd, '.oxlintrc.json')))
    assert.ok(existsSync(join(cwd, 'app.test.ts')))
    assert.ok(existsSync(join(cwd, 'views/index.ejs')))

    const manifest = pkg()
    assert.ok('express' in manifest.dependencies)
    assert.ok('ejs' in manifest.dependencies)
    assert.ok('oxlint' in manifest.devDependencies)
    assert.ok('oxfmt' in manifest.devDependencies)
    assert.ok('typescript' in manifest.devDependencies)
    // A native-capable Node uses `node --watch`; tsx stays for the test runner.
    if (supportsNativeTypeStripping(process.versions.node)) {
      assert.equal(manifest.scripts.dev, 'node --watch server.ts')
    } else {
      assert.equal(manifest.scripts.dev, 'tsx watch server.ts')
    }
    assert.ok('tsx' in manifest.devDependencies)
    assert.equal(manifest.scripts.build, 'tsc')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('ignores node_modules present in a fragment', async () => {
  const planted = join(BASE_FRAGMENT, 'node_modules')
  mkdirSync(planted, { recursive: true })
  writeFileSync(join(planted, 'marker.js'), '')

  const { context, cwd } = compose({})
  try {
    await composeAction(context)
    assert.ok(existsSync(join(cwd, 'app.js')))
    assert.ok(!existsSync(join(cwd, 'node_modules')), 'node_modules must not be copied')
  } finally {
    rmSync(planted, { recursive: true, force: true })
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('composes a project with the Node.js test runner and no extra deps', async () => {
  const { context, cwd, pkg } = compose({ typescript: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.test.ts')))
    assert.ok(!existsSync(join(cwd, 'app.test.js')))

    const manifest = pkg()
    assert.equal(manifest.scripts.test, 'node --import tsx --test')
    assert.ok(!('vitest' in (manifest.devDependencies ?? {})), 'node:test must not pull in vitest')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('api example: scaffolds routes/middleware and strips @types for JavaScript', async () => {
  const { context, cwd, pkg } = compose({ example: 'api' })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.js')))
    assert.ok(existsSync(join(cwd, 'routes/users.js')))
    assert.ok(existsSync(join(cwd, 'middleware/error-handler.js')))

    const manifest = pkg()
    assert.ok('morgan' in manifest.dependencies)
    // @types/morgan is dropped for a JS project; the linter tooling stays.
    const typed = Object.keys(manifest.devDependencies).filter((dep) => dep.startsWith('@types/'))
    assert.deepEqual(typed, [], 'JS project should not keep @types/* packages')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('api example: keeps @types packages for TypeScript', async () => {
  const { context, cwd, pkg } = compose({ example: 'api', typescript: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.ts')))
    assert.ok(existsSync(join(cwd, 'routes/users.ts')))

    const manifest = pkg()
    assert.ok('@types/morgan' in manifest.devDependencies)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('web example: composes the views hook, static assets and error page', async () => {
  const { context, cwd } = compose({ example: 'web', view: 'ejs', typescript: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.ts')))
    assert.ok(existsSync(join(cwd, 'routes/index.ts')))
    assert.ok(existsSync(join(cwd, 'public/stylesheets/style.css')))
    assert.ok(existsSync(join(cwd, 'views/index.ejs')))
    assert.ok(existsSync(join(cwd, 'views/error.ejs')))

    // The view fragment overrides the example's no-op setupViews hook.
    assert.match(readFileSync(join(cwd, 'views.ts'), 'utf-8'), /view engine/)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('mvc example: composes layers and keeps only the chosen view engine', async () => {
  const { context, cwd } = compose({ example: 'mvc', view: 'ejs', typescript: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'routes/users.ts')))
    assert.ok(existsSync(join(cwd, 'controllers/users.ts')))
    assert.ok(existsSync(join(cwd, 'services/users.ts')))
    assert.ok(existsSync(join(cwd, 'middleware/error-handler.ts')))

    // The mvc users view ships in every engine; only the chosen one survives.
    assert.ok(existsSync(join(cwd, 'views/users.ejs')))
    assert.ok(!existsSync(join(cwd, 'views/users.pug')))
    assert.ok(!existsSync(join(cwd, 'views/users.hbs')))
    assert.ok(existsSync(join(cwd, 'views/index.ejs'))) // from the view fragment
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('selects the example-specific test and removes the staging dir', async () => {
  const { context, cwd } = compose({ example: 'api' })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.test.js')))
    assert.ok(!existsSync(join(cwd, 'tests')), 'the tests/ staging dir is removed')
    // The api test exercises the example's own routes, not just GET /.
    assert.match(readFileSync(join(cwd, 'app.test.js'), 'utf-8'), /\/api\/users/)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('handlebars view: uses the native hbs engine', async () => {
  const { context, cwd, pkg } = compose({ example: 'web', view: 'handlebars', typescript: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'views/index.hbs')))
    assert.match(readFileSync(join(cwd, 'views.ts'), 'utf-8'), /'hbs'/)
    assert.ok('hbs' in pkg().dependencies)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('generates a README with the package manager and scripts', async () => {
  const { context, cwd } = compose({
    typescript: true,
    packageManager: 'pnpm',
  })
  try {
    await composeAction(context)

    const doc = readFileSync(join(cwd, 'README.md'), 'utf-8')
    assert.match(doc, /^# demo/m)
    assert.match(doc, /pnpm install/)
    assert.match(doc, /pnpm dev/) // non-npm needs no "run" prefix
    assert.match(doc, /pnpm build/) // build script listed
    assert.match(doc, /pnpm lint/)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('pins the running Node version in .nvmrc and devEngines', async () => {
  const { context, cwd, pkg } = compose({})
  try {
    await composeAction(context)

    assert.equal(readFileSync(join(cwd, '.nvmrc'), 'utf-8').trim(), process.versions.node)

    const { runtime } = pkg().devEngines
    assert.equal(runtime.name, 'node')
    assert.equal(runtime.version, `>=${process.versions.node}`)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('adds a Dockerfile and .dockerignore when docker is enabled', async () => {
  const { context, cwd } = compose({ docker: true })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'Dockerfile')))
    assert.ok(existsSync(join(cwd, '.dockerignore')), '_dockerignore should be renamed')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('composes a JavaScript project with pug', async () => {
  const { context, cwd, pkg } = compose({ view: 'pug' })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.js')))
    assert.ok(existsSync(join(cwd, 'views/index.pug')))
    assert.ok(!existsSync(join(cwd, 'app.ts')), 'TS files must be dropped in a JS project')

    const manifest = pkg()
    assert.ok('pug' in manifest.dependencies)
    assert.ok('oxlint' in manifest.devDependencies)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
