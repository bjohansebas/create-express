import { expect, test } from 'vitest'
import { app } from './app.js'

test('GET / responds with 200', async () => {
  const server = app.listen(0)
  const { port } = server.address()

  try {
    const response = await fetch(`http://localhost:${port}/`)
    expect(response.status).toBe(200)
  } finally {
    server.close()
  }
})
