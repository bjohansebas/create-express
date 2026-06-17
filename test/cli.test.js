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
