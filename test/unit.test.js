import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { toValidPackageName } from '../src/actions/project-name.js'
import { deepMerge, sortDependencies } from '../src/utils/merge.js'
import { isEmpty } from '../src/utils/os.js'
import { pkgFromUserAgent } from '../src/utils/package-manager.js'

test('toValidPackageName coerces arbitrary names', () => {
  assert.equal(toValidPackageName('My_App'), 'my-app')
  assert.equal(toValidPackageName('  Hello World '), 'hello-world')
  assert.equal(toValidPackageName('.hidden'), 'hidden')
  assert.equal(toValidPackageName('already-valid'), 'already-valid')
})

test('deepMerge merges nested objects and overrides scalars', () => {
  const result = deepMerge(
    { scripts: { dev: 'a', start: 'x' }, dependencies: { express: '5' } },
    { scripts: { dev: 'b', build: 'tsc' }, devDependencies: { vitest: '3' } },
  )
  assert.deepEqual(result, {
    scripts: { dev: 'b', start: 'x', build: 'tsc' },
    dependencies: { express: '5' },
    devDependencies: { vitest: '3' },
  })
})

test('deepMerge does not mutate its inputs', () => {
  const target = { a: { b: 1 } }
  deepMerge(target, { a: { c: 2 } })
  assert.deepEqual(target, { a: { b: 1 } })
})

test('sortDependencies sorts dependency maps alphabetically', () => {
  const pkg = sortDependencies({ dependencies: { express: '5', ejs: '3', axios: '1' } })
  assert.deepEqual(Object.keys(pkg.dependencies), ['axios', 'ejs', 'express'])
})

test('pkgFromUserAgent parses the package manager', () => {
  assert.deepEqual(pkgFromUserAgent('pnpm/9.1.0 npm/? node/v22.0.0 linux x64'), {
    name: 'pnpm',
    version: '9.1.0',
  })
  assert.equal(pkgFromUserAgent(undefined), undefined)
  assert.equal(pkgFromUserAgent(''), undefined)
})

test('isEmpty treats missing/empty dirs as empty and ignores safe files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'create-express-empty-'))
  try {
    assert.equal(isEmpty(join(dir, 'does-not-exist')), true)
    assert.equal(isEmpty(dir), true)

    writeFileSync(join(dir, '.gitignore'), '')
    assert.equal(isEmpty(dir), true, '.gitignore should not count as a conflict')

    writeFileSync(join(dir, 'index.js'), '')
    assert.equal(isEmpty(dir), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
