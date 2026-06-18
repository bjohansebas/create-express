import assert from 'node:assert/strict'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url))

function directoriesIn(path) {
  return readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory())
}

test('every test runner ships a test for every example, in JS and TS', () => {
  const examples = directoriesIn(join(TEMPLATES, 'example'))
  const runners = directoriesIn(join(TEMPLATES, 'test'))

  assert.ok(examples.length > 0, 'expected at least one example')
  assert.ok(runners.length > 0, 'expected at least one test runner')

  const missing = []
  for (const runner of runners) {
    for (const example of examples) {
      for (const ext of ['js', 'ts']) {
        if (!existsSync(join(TEMPLATES, 'test', runner, 'tests', `${example}.test.${ext}`))) {
          missing.push(`test/${runner}/tests/${example}.test.${ext}`)
        }
      }
    }
  }

  assert.deepEqual(missing, [], `missing example tests:\n  ${missing.join('\n  ')}`)
})
