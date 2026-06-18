import type { AddressInfo } from 'node:net'
import { expect, test } from 'vitest'
import { app } from './app.ts'

test('responds on its routes', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${(server.address() as AddressInfo).port}`

  try {
    expect((await fetch(`${base}/`)).status).toBe(200)
  } finally {
    server.close()
  }
})
