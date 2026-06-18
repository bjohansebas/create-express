import { select } from '@inquirer/prompts'

const LANGUAGES = [
  { value: 'ts', name: 'TypeScript' },
  { value: 'js', name: 'JavaScript' },
]

const VIEWS = [
  { value: 'none', name: 'None (JSON API)' },
  { value: 'ejs', name: 'EJS' },
  { value: 'pug', name: 'Pug' },
]

const LINTERS = [
  { value: 'biome', name: 'Biome' },
  { value: 'eslint', name: 'ESLint' },
  { value: 'none', name: 'None' },
]

const TESTS = [
  { value: 'none', name: 'None' },
  { value: 'vitest', name: 'Vitest' },
  { value: 'node', name: 'Node.js (node:test)' },
]

function assertChoice(key, value, choices) {
  if (value !== undefined && value !== null && !choices.some((choice) => choice.value === value)) {
    const allowed = choices.map((choice) => choice.value).join(', ')
    throw new Error(`Invalid value "${value}" for --${key}. Expected one of: ${allowed}.`)
  }
}

/**
 * Resolve an option from (in order): an explicit flag, the `--yes` default, or
 * an interactive prompt.
 */
async function resolveOption(context, key, { choices, message, fallback }) {
  assertChoice(key, context[key], choices)

  if (context[key] !== undefined && context[key] !== null) {
    return context[key]
  }
  if (context.yes) {
    return fallback
  }

  return select({ message, choices, default: fallback })
}

export default async function selectFeaturesAction(context) {
  context.language = await resolveOption(context, 'language', {
    choices: LANGUAGES,
    message: 'Which language do you want to use?',
    fallback: 'ts',
  })
  context.typescript = context.language === 'ts'

  context.view = await resolveOption(context, 'view', {
    choices: VIEWS,
    message: 'Which view engine do you want?',
    fallback: 'none',
  })

  context.linter = await resolveOption(context, 'linter', {
    choices: LINTERS,
    message: 'Which linter do you want?',
    fallback: 'biome',
  })

  context.test = await resolveOption(context, 'test', {
    choices: TESTS,
    message: 'Add a test runner?',
    fallback: 'none',
  })

  return context
}
