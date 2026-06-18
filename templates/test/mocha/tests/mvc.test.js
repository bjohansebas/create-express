import assert from 'node:assert/strict'
import { describe, it } from 'mocha'
import { app } from './app.js'

describe('app', () => {
  it('responds on its routes', async () => {
    const server = app.listen(0)
    const base = `http://localhost:${server.address().port}`

    try {
      assert.equal((await fetch(`${base}/`)).status, 200)
      assert.equal((await fetch(`${base}/users`)).status, 200)
      assert.equal((await fetch(`${base}/nope`)).status, 404)
    } finally {
      server.close()
    }
  })
})
