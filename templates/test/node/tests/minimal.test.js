import assert from 'node:assert/strict'
import { test } from 'node:test'
import { faker } from '@faker-js/faker'
import { app } from './app.js'

test('responds on its routes', async () => {
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    assert.equal((await fetch(`${base}/`)).status, 200)
  } finally {
    server.close()
  }
})

test('greets a validated name', async () => {
  const name = faker.person.firstName()

  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const ok = await fetch(`${base}/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    assert.equal(ok.status, 200)
    assert.deepEqual(await ok.json(), { message: `Hello, ${name}!` })

    const bad = await fetch(`${base}/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    assert.equal(bad.status, 400)
  } finally {
    server.close()
  }
})
