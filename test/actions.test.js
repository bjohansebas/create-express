import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, mock, test } from 'node:test'
import composeAction from '../src/actions/compose.js'
import { getContext } from '../src/actions/context.js'
import gitAction from '../src/actions/git.js'
import nextStepsAction from '../src/actions/next-steps.js'
import projectNameAction from '../src/actions/project-name.js'
import selectFeaturesAction from '../src/actions/select-features.js'
import { getPackageManager } from '../src/utils/package-manager.js'

const tempDirs = []
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), 'create-express-act-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  mock.restoreAll()
  while (tempDirs.length) {
    rmSync(tempDirs.pop(), { recursive: true, force: true })
  }
})

function captureLog() {
  const log = mock.method(console, 'log')
  return () => log.mock.calls.map((call) => call.arguments.join(' ')).join('\n')
}

test('getContext maps options and defaults yes to false', () => {
  const context = getContext('my-app', {
    language: 'ts',
    view: 'ejs',
    linter: 'biome',
    test: 'vitest',
    git: true,
    install: false,
    packageManager: 'pnpm',
  })

  assert.equal(context.projectName, 'my-app')
  assert.equal(context.language, 'ts')
  assert.equal(context.view, 'ejs')
  assert.equal(context.git, true)
  assert.equal(context.install, false)
  assert.equal(context.yes, false)
  assert.equal(context.packageManager, 'pnpm')
})

test('getContext keeps an explicit yes flag', () => {
  assert.equal(getContext('x', { yes: true }).yes, true)
})

test('getPackageManager detects from the user agent and falls back to npm', () => {
  const original = process.env.npm_config_user_agent
  try {
    process.env.npm_config_user_agent = 'yarn/4.0.0 node/v22.11.0'
    assert.equal(getPackageManager(), 'yarn')

    delete process.env.npm_config_user_agent
    assert.equal(getPackageManager(), 'npm')
  } finally {
    if (original === undefined) {
      delete process.env.npm_config_user_agent
    } else {
      process.env.npm_config_user_agent = original
    }
  }
})

test('nextStepsAction prints cd/install/test lines when needed', () => {
  const output = captureLog()
  nextStepsAction({
    packageManager: 'pnpm',
    cwd: join(process.cwd(), 'sub-app'),
    install: false,
    test: 'vitest',
  })

  const text = output()
  assert.match(text, /cd sub-app/)
  assert.match(text, /pnpm install/)
  assert.match(text, /pnpm dev/)
  assert.match(text, /pnpm test/)
})

test('nextStepsAction omits cd/install when in place and already installed', () => {
  const output = captureLog()
  nextStepsAction({ packageManager: 'npm', cwd: process.cwd(), install: true, test: 'none' })

  const text = output()
  assert.doesNotMatch(text, /cd /)
  assert.doesNotMatch(text, /install/)
  assert.match(text, /npm run dev/)
  assert.doesNotMatch(text, /npm run test/)
})

test('gitAction is a no-op when the directory is already a repository', async () => {
  const dir = tmp()
  mkdirSync(join(dir, '.git'))

  const context = { cwd: dir, git: undefined, yes: false }
  await gitAction(context)

  assert.equal(context.git, undefined)
})

test('composeAction throws for a missing fragment', async () => {
  const dir = tmp()
  await assert.rejects(
    composeAction({ cwd: dir, projectName: 'x', typescript: false, view: 'bogus', linter: 'none', test: 'none' }),
    /Template fragment "view\/bogus" does not exist/,
  )
})

test('selectFeaturesAction with --yes applies the defaults', async () => {
  const context = { language: undefined, view: undefined, linter: undefined, test: undefined, yes: true }
  await selectFeaturesAction(context)

  assert.equal(context.language, 'ts')
  assert.equal(context.typescript, true)
  assert.equal(context.view, 'none')
  assert.equal(context.linter, 'biome')
  assert.equal(context.test, 'none')
})

test('projectNameAction with --yes sanitizes an invalid basename', async () => {
  const target = join(tmp(), 'Bad_Name')

  const context = { projectName: target, yes: true }
  await projectNameAction(context)

  assert.equal(context.projectName, 'bad-name')
})

test('projectNameAction with --yes throws on a non-empty directory', async () => {
  const dir = tmp()
  writeFileSync(join(dir, 'file.txt'), 'x')

  await assert.rejects(projectNameAction({ projectName: dir, yes: true }), /is not empty/)
})

test('projectNameAction with --force clears a non-empty directory but keeps .git', async () => {
  const dir = tmp()
  writeFileSync(join(dir, 'old.txt'), 'x')
  mkdirSync(join(dir, '.git'))

  const context = { projectName: dir, force: true, yes: true }
  await projectNameAction(context)

  assert.ok(!existsSync(join(dir, 'old.txt')), 'existing files are removed')
  assert.ok(existsSync(join(dir, '.git')), '.git is preserved')
})

test('selectFeaturesAction defaults the view engine for the web starter', async () => {
  const context = { example: 'web', language: 'ts', view: undefined, linter: 'none', test: 'none', yes: true }
  await selectFeaturesAction(context)

  assert.equal(context.view, 'ejs')
})

test('selectFeaturesAction keeps an explicit view engine for the web starter', async () => {
  const context = { example: 'web', language: 'ts', view: 'pug', linter: 'none', test: 'none', yes: true }
  await selectFeaturesAction(context)

  assert.equal(context.view, 'pug')
})

test('selectFeaturesAction rejects "none" as a view engine for the web starter', async () => {
  const context = { example: 'web', language: 'ts', view: 'none', linter: 'none', test: 'none', yes: true }

  await assert.rejects(selectFeaturesAction(context), /Invalid value "none" for --view/)
})

test('selectFeaturesAction defaults the view engine for the mvc starter', async () => {
  const context = { example: 'mvc', language: 'ts', view: undefined, linter: 'none', test: 'none', yes: true }
  await selectFeaturesAction(context)

  assert.equal(context.view, 'ejs')
})

test('selectFeaturesAction keeps options provided as flags', async () => {
  const context = { language: 'js', view: 'pug', linter: undefined, test: undefined, yes: true }
  await selectFeaturesAction(context)

  assert.equal(context.language, 'js')
  assert.equal(context.view, 'pug')
  assert.equal(context.linter, 'biome')
  assert.equal(context.test, 'none')
})

test('projectNameAction reuses an existing empty directory', async () => {
  const dir = join(tmp(), 'existing-app')
  mkdirSync(dir)

  const context = { projectName: dir, yes: true }
  await projectNameAction(context)

  assert.equal(context.projectName, 'existing-app')
  assert.ok(context.cwd.endsWith('existing-app'))
})

test('projectNameAction with --yes falls back to the default name when sanitizing yields nothing', async () => {
  const target = join(tmp(), '___')

  const context = { projectName: target, yes: true }
  await projectNameAction(context)

  assert.equal(context.projectName, 'my-express-server')
})

test('projectNameAction with --yes falls back to the default directory name', async () => {
  const dir = tmp()
  const previousCwd = process.cwd()
  process.chdir(dir)
  try {
    const context = { projectName: undefined, yes: true }
    await projectNameAction(context)
    assert.equal(context.projectName, 'my-express-server')
  } finally {
    process.chdir(previousCwd)
  }
})
