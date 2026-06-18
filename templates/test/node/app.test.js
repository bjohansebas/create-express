import assert from 'node:assert/strict'
import { test } from 'node:test'
import { app } from './app.js'

test('GET / responds with 200', async () => {
  const server = app.listen(0)
  const { port } = server.address()

  try {
    const response = await fetch(`http://localhost:${port}/`)
    assert.equal(response.status, 200)
  } finally {
    server.close()
  }
})
