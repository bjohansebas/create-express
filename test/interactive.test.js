import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, mock, test } from 'node:test'

// Stub the interactive prompts and child_process so the prompt-driven branches
// can run without a TTY (or actually shelling out). The stubs read from mutable
// state that each test sets up, so we only mock once.
const answers = { input: [], select: [], confirm: [] }
let spawnCalls = []
let spawnStatus = 0

mock.module('@inquirer/prompts', {
  namedExports: {
    // Mimic inquirer: when a `validate` is provided, run it and re-prompt
    // (consume the next queued answer) until it passes.
    input: async (options = {}) => {
      while (answers.input.length > 0) {
        const value = answers.input.shift()
        if (typeof options.validate === 'function' && options.validate(value) !== true) {
          continue
        }
        return value
      }
      return undefined
    },
    select: async () => answers.select.shift(),
    confirm: async () => answers.confirm.shift(),
  },
})

mock.module('node:child_process', {
  namedExports: {
    spawnSync: (command, args = []) => {
      spawnCalls.push([command, ...args])
      return { status: spawnStatus }
    },
  },
})

const { default: projectNameAction } = await import('../src/actions/project-name.js')
const { default: selectFeaturesAction } = await import('../src/actions/select-features.js')
const { default: gitAction } = await import('../src/actions/git.js')
const { default: installAction } = await import('../src/actions/install.js')

const tempDirs = []
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), 'create-express-int-'))
  tempDirs.push(dir)
  return dir
}

beforeEach(() => {
  answers.input = []
  answers.select = []
  answers.confirm = []
  spawnCalls = []
  spawnStatus = 0
  while (tempDirs.length) {
    rmSync(tempDirs.pop(), { recursive: true, force: true })
  }
})

test('project-name: prompts for the directory when none is provided', async () => {
  const target = join(tmp(), 'fresh-app')
  answers.input = [target]

  const context = { projectName: undefined, yes: false }
  await projectNameAction(context)

  assert.equal(context.projectName, 'fresh-app')
  assert.ok(context.cwd.endsWith('fresh-app'))
})

test('project-name: prompts for a name (rejecting invalid input) when the basename is invalid', async () => {
  const target = join(tmp(), 'Bad_Name')
  // First answer is still invalid (rejected by `validate`), second one is accepted.
  answers.input = ['Also Invalid!', 'fixed-name']

  const context = { projectName: target, yes: false }
  await projectNameAction(context)

  assert.equal(context.projectName, 'fixed-name')
})

test('project-name: clears the directory when overwrite is confirmed', async () => {
  const dir = tmp()
  writeFileSync(join(dir, 'old.txt'), 'x')
  answers.confirm = [true]

  const context = { projectName: dir, yes: false }
  await projectNameAction(context)

  assert.ok(!existsSync(join(dir, 'old.txt')), 'existing files are removed')
})

test('project-name: re-prompts for a location when overwrite is declined', async () => {
  const busy = tmp()
  writeFileSync(join(busy, 'old.txt'), 'x')
  const fresh = join(tmp(), 'fresh-app')
  answers.confirm = [false]
  answers.input = [fresh]

  const context = { projectName: busy, yes: false }
  await projectNameAction(context)

  assert.equal(context.projectName, 'fresh-app')
  assert.ok(existsSync(join(busy, 'old.txt')), 'the busy directory is left untouched')
})

test('select-features: falls back to prompts when no flags are given', async () => {
  // Prompt order: language, module, example, view, linter, test, package manager.
  answers.select = ['js', 'esm', 'api', 'ejs', 'eslint', 'vitest', 'pnpm']

  const context = {
    language: undefined,
    module: undefined,
    example: undefined,
    view: undefined,
    linter: undefined,
    test: undefined,
    packageManager: undefined,
    yes: false,
  }
  await selectFeaturesAction(context)

  assert.equal(context.language, 'js')
  assert.equal(context.typescript, false)
  assert.equal(context.module, 'esm')
  assert.equal(context.example, 'api')
  assert.equal(context.view, 'ejs')
  assert.equal(context.linter, 'eslint')
  assert.equal(context.test, 'vitest')
  assert.equal(context.packageManager, 'pnpm')
})

test('git: initializes the repository when confirmed', async () => {
  answers.confirm = [true]

  const context = { cwd: tmp(), git: undefined, yes: false }
  await gitAction(context)

  assert.equal(context.git, true)
  assert.ok(spawnCalls.some(([command]) => command === 'git'))
})

test('git: skips initialization when declined', async () => {
  answers.confirm = [false]

  const context = { cwd: tmp(), git: undefined, yes: false }
  await gitAction(context)

  assert.equal(context.git, false)
  assert.equal(spawnCalls.length, 0)
})

test('install: installs with the package manager when confirmed', async () => {
  answers.confirm = [true]
  spawnStatus = 0

  const context = { cwd: tmp(), install: undefined, yes: false, packageManager: 'npm' }
  await installAction(context)

  assert.equal(context.install, true)
  assert.deepEqual(spawnCalls[0], ['npm', 'install'])
})

test('install: flags install as failed when the package manager errors', async () => {
  answers.confirm = [true]
  spawnStatus = 1

  const context = { cwd: tmp(), install: undefined, yes: false, packageManager: 'pnpm' }
  await installAction(context)

  assert.equal(context.install, false)
})

test('install: skips installation when declined', async () => {
  answers.confirm = [false]

  const context = { cwd: tmp(), install: undefined, yes: false, packageManager: 'npm' }
  await installAction(context)

  assert.equal(context.install, false)
  assert.equal(spawnCalls.length, 0)
})

test('git: initializes without prompting under --yes', async () => {
  const context = { cwd: tmp(), git: undefined, yes: true }
  await gitAction(context)

  assert.equal(context.git, true)
  assert.equal(answers.confirm.length, 0)
  assert.ok(spawnCalls.some(([command]) => command === 'git'))
})

test('install: installs without prompting under --yes', async () => {
  const context = { cwd: tmp(), install: undefined, yes: true, packageManager: 'npm' }
  await installAction(context)

  assert.equal(context.install, true)
  assert.deepEqual(spawnCalls[0], ['npm', 'install'])
})
