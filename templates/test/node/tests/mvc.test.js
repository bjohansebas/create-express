import assert from 'node:assert/strict'
import { test } from 'node:test'
import { faker } from '@faker-js/faker'
import { app } from './app.js'
import { migrator } from './migrate.js'
import { createUser } from './services/users.js'

// The server migrates on boot; tests arrange their own database.
await migrator.up()

// EJS escapes rendered values, so the assertion must escape the same way.
function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&#34;')
    .replace(/'/g, '&#39;')
}

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

test('renders users created through the service', async () => {
  const user = createUser(faker.person.fullName())

  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const response = await fetch(`${base}/users`)
    assert.equal(response.status, 200)

    const page = await response.text()
    assert.ok(page.includes(escapeHtml(user.name)), `page should list ${user.name}`)
  } finally {
    server.close()
  }
})
