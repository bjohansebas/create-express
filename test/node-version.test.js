import assert from 'node:assert/strict'
import { test } from 'node:test'
import { supportsNativeTypeStripping } from '../src/utils/node.js'

test('supportsNativeTypeStripping is true from Node 22.18', () => {
  assert.equal(supportsNativeTypeStripping('22.17.0'), false)
  assert.equal(supportsNativeTypeStripping('22.18.0'), true)
  assert.equal(supportsNativeTypeStripping('22.20.1'), true)
})

test('supportsNativeTypeStripping covers other major versions', () => {
  assert.equal(supportsNativeTypeStripping('20.19.0'), false)
  assert.equal(supportsNativeTypeStripping('24.16.0'), true)
  assert.equal(supportsNativeTypeStripping('26.0.0'), true)
})
