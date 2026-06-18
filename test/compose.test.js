import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import composeAction from '../src/actions/compose.js'

const BASE_FRAGMENT = fileURLToPath(new URL('../templates/base', import.meta.url))

function compose(overrides) {
  const cwd = mkdtempSync(join(tmpdir(), 'create-express-compose-'))
  const context = {
    cwd,
    projectName: 'demo',
    typescript: false,
    view: 'none',
    linter: 'none',
    test: 'none',
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
    assert.ok(!existsSync(join(cwd, 'biome.json')))

    const manifest = pkg()
    assert.equal(manifest.name, 'demo')
    assert.deepEqual(Object.keys(manifest.dependencies), ['express'])
    assert.equal(manifest.scripts.dev, 'node --watch server.js')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('composes a full TypeScript project (ejs + biome + vitest)', async () => {
  const { context, cwd, pkg } = compose({
    typescript: true,
    view: 'ejs',
    linter: 'biome',
    test: 'vitest',
  })
  try {
    await composeAction(context)

    // TS wins over JS where both exist.
    assert.ok(existsSync(join(cwd, 'app.ts')))
    assert.ok(existsSync(join(cwd, 'server.ts')))
    assert.ok(!existsSync(join(cwd, 'app.js')), 'app.js must be dropped in a TS project')
    assert.ok(!existsSync(join(cwd, 'server.js')))

    assert.ok(existsSync(join(cwd, 'tsconfig.json')))
    assert.ok(existsSync(join(cwd, 'biome.json')))
    assert.ok(existsSync(join(cwd, 'app.test.ts')))
    assert.ok(existsSync(join(cwd, 'views/index.ejs')))

    const manifest = pkg()
    assert.ok('express' in manifest.dependencies)
    assert.ok('ejs' in manifest.dependencies)
    assert.ok('@biomejs/biome' in manifest.devDependencies)
    assert.ok('typescript' in manifest.devDependencies)
    assert.ok('vitest' in manifest.devDependencies)
    assert.equal(manifest.scripts.dev, 'tsx watch server.ts')
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
  const { context, cwd, pkg } = compose({ typescript: true, test: 'node' })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.test.ts')))
    assert.ok(!existsSync(join(cwd, 'app.test.js')))

    const manifest = pkg()
    assert.equal(manifest.scripts.test, 'node --test')
    assert.ok(!('vitest' in (manifest.devDependencies ?? {})), 'node:test must not pull in vitest')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('composes a JavaScript project with pug + eslint', async () => {
  const { context, cwd, pkg } = compose({ view: 'pug', linter: 'eslint' })
  try {
    await composeAction(context)

    assert.ok(existsSync(join(cwd, 'app.js')))
    assert.ok(existsSync(join(cwd, 'eslint.config.js')))
    assert.ok(existsSync(join(cwd, 'views/index.pug')))
    assert.ok(!existsSync(join(cwd, 'app.ts')), 'TS files must be dropped in a JS project')

    const manifest = pkg()
    assert.ok('pug' in manifest.dependencies)
    assert.ok('eslint' in manifest.devDependencies)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
