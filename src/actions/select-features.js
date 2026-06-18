import { select } from '@inquirer/prompts'

const LANGUAGES = [
  { value: 'ts', name: 'TypeScript' },
  { value: 'js', name: 'JavaScript' },
]

const EXAMPLES = [
  { value: 'minimal', name: 'Minimal (Hello World)' },
  { value: 'api', name: 'REST API (JSON)' },
  { value: 'web', name: 'Web app (views + static)' },
  { value: 'mvc', name: 'Structured / MVC' },
]

const VIEWS = [
  { value: 'none', name: 'None (JSON API)' },
  { value: 'ejs', name: 'EJS' },
  { value: 'pug', name: 'Pug' },
]

// The web starter renders server-side views, so "none" is not an option there.
const WEB_VIEWS = [
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
  { value: 'mocha', name: 'Mocha' },
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

  context.example = await resolveOption(context, 'example', {
    choices: EXAMPLES,
    message: 'Which starter example do you want?',
    fallback: 'minimal',
  })

  const webView = context.example === 'web'
  context.view = await resolveOption(context, 'view', {
    choices: webView ? WEB_VIEWS : VIEWS,
    message: 'Which view engine do you want?',
    fallback: webView ? 'ejs' : 'none',
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
