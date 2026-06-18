import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { app } from './app.ts'

test('GET / responds with 200', async () => {
  const server = app.listen(0)
  const { port } = server.address() as AddressInfo

  try {
    const response = await fetch(`http://localhost:${port}/`)
    assert.equal(response.status, 200)
  } finally {
    server.close()
  }
})
