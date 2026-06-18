import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// End-to-end: scaffold a real project, install dependencies, and run the
// generated project's own lint / test / build scripts. Slow + needs network,
// so this lives in a separate `test:e2e` script (not the unit suite).

const BIN = fileURLToPath(new URL('../../bin/index.js', import.meta.url))

function run(command, args, cwd) {
  // On Windows, npm is a `.cmd` shim that needs a shell to resolve.
  return spawnSync(command, args, { cwd, encoding: 'utf-8', shell: process.platform === 'win32' })
}

// A spread of combinations covering both module systems, both languages, every
// example, every linter and every test runner.
const COMBOS = [
  {
    name: 'ESM TS api + biome + vitest',
    flags: ['--ts', '--esm', '--example', 'api', '--view', 'none', '--linter', 'biome', '--test', 'vitest'],
    build: true,
  },
  {
    name: 'ESM JS web + handlebars + eslint + node',
    flags: ['--js', '--esm', '--example', 'web', '--view', 'handlebars', '--linter', 'eslint', '--test', 'node'],
    build: false,
  },
  {
    name: 'CJS JS mvc + oxlint + mocha',
    flags: ['--js', '--cjs', '--example', 'mvc', '--view', 'none', '--linter', 'oxlint', '--test', 'mocha'],
    build: false,
  },
  {
    name: 'CJS TS minimal + biome + vitest',
    flags: ['--ts', '--cjs', '--example', 'minimal', '--view', 'none', '--linter', 'biome', '--test', 'vitest'],
    build: true,
  },
]

for (const combo of COMBOS) {
  test(`e2e: ${combo.name}`, { timeout: 300_000 }, () => {
    const root = mkdtempSync(join(tmpdir(), 'create-express-e2e-'))
    const target = join(root, 'app')
    try {
      const generate = run('node', [BIN, target, ...combo.flags, '--pm', 'npm', '--no-git', '--no-install'])
      assert.equal(generate.status, 0, generate.stderr)

      const install = run('npm', ['install', '--no-audit', '--no-fund'], target)
      assert.equal(install.status, 0, install.stderr)

      const lint = run('npm', ['run', 'lint'], target)
      assert.equal(lint.status, 0, `lint failed:\n${lint.stdout}\n${lint.stderr}`)

      const tested = run('npm', ['test'], target)
      assert.equal(tested.status, 0, `test failed:\n${tested.stdout}\n${tested.stderr}`)

      if (combo.build) {
        const build = run('npm', ['run', 'build'], target)
        assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}
