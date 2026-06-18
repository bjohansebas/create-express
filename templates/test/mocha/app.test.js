import assert from 'node:assert/strict'
import { describe, it } from 'mocha'
import { app } from './app.js'

describe('app', () => {
  it('responds with 200 on GET /', async () => {
    const server = app.listen(0)
    const { port } = server.address()

    try {
      const response = await fetch(`http://localhost:${port}/`)
      assert.equal(response.status, 200)
    } finally {
      server.close()
    }
  })
})
