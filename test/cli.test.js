import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const BIN = fileURLToPath(new URL('../bin/index.js', import.meta.url))

function run(args) {
  return spawnSync('node', [BIN, ...args], { encoding: 'utf-8' })
}

test('scaffolds end-to-end with --yes (non-interactive)', () => {
  const parent = mkdtempSync(join(tmpdir(), 'create-express-cli-'))
  const target = join(parent, 'my-app')
  try {
    const result = run([target, '--yes', '--no-install', '--no-git'])

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(target, 'package.json')))
    assert.ok(existsSync(join(target, 'app.ts')), 'default language is TypeScript')

    const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf-8'))
    assert.equal(manifest.name, 'my-app')
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
})

test('scaffolds and initializes git with --yes (no explicit git flag)', () => {
  const parent = mkdtempSync(join(tmpdir(), 'create-express-cli-'))
  const target = join(parent, 'git-app')
  try {
    const result = run([target, '--yes', '--no-install'])

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(target, '.git')), 'git repository should be initialized')
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
})

test('honors the --ts and --js language flags', () => {
  for (const [flag, expectedFile] of [
    ['--ts', 'app.ts'],
    ['--js', 'app.js'],
  ]) {
    const parent = mkdtempSync(join(tmpdir(), 'create-express-cli-'))
    const target = join(parent, 'lang-app')
    try {
      const result = run([target, flag, '--yes', '--no-install', '--no-git'])

      assert.equal(result.status, 0, result.stderr)
      assert.ok(existsSync(join(target, expectedFile)), `${flag} should produce ${expectedFile}`)
    } finally {
      rmSync(parent, { recursive: true, force: true })
    }
  }
})

test('prints "Aborted." when a prompt is interrupted', () => {
  // No directory and no --yes -> it prompts; closing stdin aborts the prompt.
  const result = spawnSync('node', [BIN], { input: '', encoding: 'utf-8' })

  assert.equal(result.status, 1)
  assert.match(result.stdout, /Aborted/)
})

test('rejects an invalid option value with a clean error', () => {
  const parent = mkdtempSync(join(tmpdir(), 'create-express-cli-'))
  try {
    const result = run([join(parent, 'app'), '--view', 'svelte', '--yes', '--no-install', '--no-git'])

    assert.equal(result.status, 1)
    assert.match(result.stderr, /Invalid value "svelte" for --view/)
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
})
