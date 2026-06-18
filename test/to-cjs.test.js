import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toCommonJs } from '../src/utils/to-cjs.js'

test('toCommonJs rewrites JS imports and exports', () => {
  const esm = [
    "import express from 'express'",
    "import { Router } from 'express'",
    "import { app } from './app.js'",
    '',
    'export const router = Router()',
    'export function handler() {}',
    '',
  ].join('\n')

  const cjs = toCommonJs(esm, false)

  assert.match(cjs, /const express = require\('express'\)/)
  assert.match(cjs, /const \{ Router \} = require\('express'\)/)
  assert.match(cjs, /const \{ app \} = require\('\.\/app'\)/) // extension stripped
  assert.match(cjs, /^const router = Router\(\)/m)
  assert.match(cjs, /^function handler\(\)/m)
  assert.match(cjs, /module\.exports = \{ router, handler \}/)
})

test('toCommonJs converts a default export', () => {
  assert.match(toCommonJs("import x from 'y'\nexport default x\n", false), /module\.exports = x/)
})

test('toCommonJs leaves a file without exports unwrapped', () => {
  const cjs = toCommonJs("import { app } from './app.js'\napp.listen(3000)\n", false)

  assert.doesNotMatch(cjs, /module\.exports/)
  assert.match(cjs, /const \{ app \} = require\('\.\/app'\)/)
})

test('toCommonJs replaces the import.meta.url idiom with __dirname', () => {
  const esm =
    "import { fileURLToPath } from 'node:url'\nconst dir = fileURLToPath(new URL('./views', import.meta.url))\n"
  const cjs = toCommonJs(esm, false)

  assert.doesNotMatch(cjs, /node:url|import\.meta/)
  assert.match(cjs, /__dirname \+ '\/views'/)
})

test('toCommonJs normalizes CRLF line endings (Windows checkouts)', () => {
  const cjs = toCommonJs("import x from 'y'\r\nexport const z = x\r\n", false)

  assert.doesNotMatch(cjs, /\r/)
  assert.match(cjs, /const x = require\('y'\)/)
  assert.match(cjs, /module\.exports = \{ z \}/)
})

test('toCommonJs keeps TS syntax but strips relative extensions', () => {
  const esm = "import type { Request } from 'express'\nimport { app } from './app.ts'\nexport const value = 1\n"
  const ts = toCommonJs(esm, true)

  assert.match(ts, /import type \{ Request \} from 'express'/) // kept
  assert.match(ts, /from '\.\/app'/) // .ts stripped
  assert.match(ts, /export const value = 1/) // export kept
})
