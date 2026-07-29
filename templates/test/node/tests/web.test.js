import assert from 'node:assert/strict'
import { test } from 'node:test'
import { faker } from '@faker-js/faker'
import { app } from './app.js'

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

test('greets a validated name', async () => {
  const name = faker.person.firstName()

  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`

  try {
    const ok = await fetch(`${base}/`, {
      method: 'POST',
      body: new URLSearchParams({ name }),
    })
    assert.equal(ok.status, 200)
    const page = await ok.text()
    assert.ok(page.includes(escapeHtml(`Hello, ${name}!`)), `page should greet ${name}`)

    const bad = await fetch(`${base}/`, {
      method: 'POST',
      body: new URLSearchParams({ name: '' }),
    })
    assert.equal(bad.status, 400)
  } finally {
    server.close()
  }
})
