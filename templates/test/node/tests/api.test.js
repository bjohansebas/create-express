import assert from 'node:assert/strict'
import { test } from 'node:test'
import { faker } from '@faker-js/faker'
import { app } from './app.js'
import { migrator } from './migrate.js'

// The server migrates on boot; tests arrange their own database.
await migrator.up()

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

test('creates and serves users', async () => {
  const name = faker.person.fullName()

  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const created = await fetch(`${base}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    assert.equal(created.status, 201)
    const user = await created.json()
    assert.equal(user.name, name)

    const users = await (await fetch(`${base}/api/users`)).json()
    assert.ok(users.some((entry) => entry.id === user.id && entry.name === name))

    const found = await (await fetch(`${base}/api/users/${user.id}`)).json()
    assert.deepEqual(found, user)

    assert.equal((await fetch(`${base}/api/users/999999`)).status, 404)

    const bad = await fetch(`${base}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    assert.equal(bad.status, 400)
  } finally {
    server.close()
  }
})
