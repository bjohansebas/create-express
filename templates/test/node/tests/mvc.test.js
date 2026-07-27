import assert from 'node:assert/strict'
import { test } from 'node:test'
import { app } from './app.js'

test('responds on its routes', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    assert.equal((await fetch(`${base}/`)).status, 200)
    assert.equal((await fetch(`${base}/nope`)).status, 404)
  } finally {
    server.close()
  }
})

test('renders the seeded users from SQLite', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const response = await fetch(`${base}/users`)
    assert.equal(response.status, 200)

    const page = await response.text()
    assert.match(page, /Ada Lovelace/)
    assert.match(page, /Alan Turing/)
  } finally {
    server.close()
  }
})
