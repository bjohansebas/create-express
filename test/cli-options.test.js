import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeNameError } from '../src/actions/project-name.js'
import { formatError, resolveOptions } from '../src/cli.js'

test('resolveOptions maps the language flags', () => {
  assert.equal(resolveOptions({ typescript: true }, () => 'cli').language, 'ts')
  assert.equal(resolveOptions({ javascript: true }, () => 'cli').language, 'js')
  assert.equal(resolveOptions({}, () => 'cli').language, undefined)
})

test('resolveOptions forwards the package manager flag', () => {
  assert.equal(resolveOptions({ packageManager: 'bun' }, () => 'cli').packageManager, 'bun')
})

test('resolveOptions forwards the force flag', () => {
  assert.equal(resolveOptions({ force: true }, () => 'cli').force, true)
})

test('resolveOptions maps the module flags', () => {
  assert.equal(resolveOptions({ esm: true }, () => 'cli').module, 'esm')
  assert.equal(resolveOptions({ cjs: true }, () => 'cli').module, 'cjs')
  assert.equal(resolveOptions({}, () => 'cli').module, undefined)
})

test('resolveOptions treats default-sourced git/install/docker as undefined', () => {
  const options = resolveOptions({ git: true, install: true, docker: true }, () => 'default')
  assert.equal(options.git, undefined)
  assert.equal(options.install, undefined)
  assert.equal(options.docker, undefined)
})

test('resolveOptions forwards an explicit docker flag', () => {
  assert.equal(resolveOptions({ docker: true }, () => 'cli').docker, true)
})

test('resolveOptions forwards explicit flags and passthrough fields', () => {
  const source = (name) => (name === 'git' ? 'cli' : 'default')
  const options = resolveOptions(
    { git: false, install: true, view: 'ejs', linter: 'biome', test: 'vitest', yes: true },
    source,
  )

  assert.equal(options.git, false) // explicitly passed
  assert.equal(options.install, undefined) // defaulted -> dropped
  assert.equal(options.view, 'ejs')
  assert.equal(options.linter, 'biome')
  assert.equal(options.test, 'vitest')
  assert.equal(options.yes, true)
})

test('formatError flags an aborted prompt', () => {
  const error = new Error('closed')
  error.name = 'ExitPromptError'
  assert.deepEqual(formatError(error), { aborted: true, message: 'Aborted.' })
})

test('formatError returns the message of a regular error', () => {
  assert.deepEqual(formatError(new Error('boom')), { aborted: false, message: 'boom' })
})

test('formatError stringifies a non-Error value', () => {
  assert.deepEqual(formatError('weird failure'), { aborted: false, message: 'weird failure' })
})

test('describeNameError prefers the first error, then warning', () => {
  assert.equal(describeNameError({ errors: ['name cannot be blank'] }), 'name cannot be blank')
  assert.equal(describeNameError({ warnings: ['name is a core module'] }), 'name is a core module')
})

test('describeNameError falls back to a generic message', () => {
  assert.equal(describeNameError({ errors: [], warnings: [] }), 'Invalid npm package name')
  assert.equal(describeNameError({}), 'Invalid npm package name')
})
