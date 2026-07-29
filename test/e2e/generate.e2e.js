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

// A spread of combinations covering both languages and every example.
const COMBOS = [
  {
    name: 'TS api',
    flags: ['--ts', '--example', 'api'],
    build: true,
  },
  {
    name: 'JS web',
    flags: ['--js', '--example', 'web'],
    build: false,
  },
  {
    name: 'JS mvc',
    flags: ['--js', '--example', 'mvc'],
    build: false,
  },
  {
    name: 'TS minimal',
    flags: ['--ts', '--example', 'minimal'],
    build: true,
  },
]

for (const combo of COMBOS) {
  test(`e2e: ${combo.name}`, { timeout: 300_000 }, () => {
    const root = mkdtempSync(join(tmpdir(), 'create-express-e2e-'))
    const target = join(root, 'app')
    try {
      // `--yes` fills any axis not pinned by the combo flags with its default,
      // keeping the run fully non-interactive.
      const generate = run('node', [BIN, target, ...combo.flags, '--pm', 'npm', '--no-git', '--no-install', '--yes'])
      assert.equal(generate.status, 0, generate.stderr)

      const install = run('npm', ['install', '--no-audit', '--no-fund'], target)
      assert.equal(install.status, 0, install.stderr)

      const lint = run('npm', ['run', 'lint'], target)
      assert.equal(lint.status, 0, `lint failed:\n${lint.stdout}\n${lint.stderr}`)

      const format = run('npm', ['run', 'format:check'], target)
      assert.equal(format.status, 0, `format:check failed:\n${format.stdout}\n${format.stderr}`)

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
