import { expect, test } from 'vitest'
import { app } from './app.js'

test('responds on its routes', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    expect((await fetch(`${base}/`)).status).toBe(200)
    expect((await fetch(`${base}/api/users`)).status).toBe(200)
    expect((await fetch(`${base}/api/users/1`)).status).toBe(200)
    expect((await fetch(`${base}/nope`)).status).toBe(404)
  } finally {
    server.close()
  }
})
