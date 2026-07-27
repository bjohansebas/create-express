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

test('serves the seeded users from SQLite', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const users = await (await fetch(`${base}/api/users`)).json()
    assert.deepEqual(users, [
      { id: 1, name: 'Ada Lovelace' },
      { id: 2, name: 'Alan Turing' },
    ])

    const user = await (await fetch(`${base}/api/users/1`)).json()
    assert.deepEqual(user, { id: 1, name: 'Ada Lovelace' })

    assert.equal((await fetch(`${base}/api/users/999`)).status, 404)
  } finally {
    server.close()
  }
})
