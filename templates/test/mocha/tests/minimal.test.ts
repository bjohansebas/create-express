import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'mocha'
import { app } from './app.ts'

describe('app', () => {
  it('responds on its routes', async () => {
    const server = app.listen(0)
    const base = `http://localhost:${(server.address() as AddressInfo).port}`

    try {
      assert.equal((await fetch(`${base}/`)).status, 200)
    } finally {
      server.close()
    }
  })
})
