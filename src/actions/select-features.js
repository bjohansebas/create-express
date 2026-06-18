import { select } from '@inquirer/prompts'
import { getPackageManager } from '../utils/package-manager.js'

const PACKAGE_MANAGERS = [
  { value: 'npm', name: 'npm' },
  { value: 'pnpm', name: 'pnpm' },
  { value: 'yarn', name: 'yarn' },
  { value: 'bun', name: 'bun' },
]

const LANGUAGES = [
  { value: 'ts', name: 'TypeScript' },
  { value: 'js', name: 'JavaScript' },
]

const MODULES = [
  { value: 'esm', name: 'ES modules (import / export)' },
  { value: 'cjs', name: 'CommonJS (require / module.exports)' },
]

const EXAMPLES = [
  { value: 'minimal', name: 'Minimal (Hello World)' },
  { value: 'api', name: 'REST API (JSON)' },
  { value: 'web', name: 'Web app (views + static)' },
  { value: 'mvc', name: 'Structured / MVC' },
]

const WEB_VIEWS = [
  { value: 'ejs', name: 'EJS' },
  { value: 'pug', name: 'Pug' },
  { value: 'handlebars', name: 'Handlebars' },
]

const VIEWS = [{ value: 'none', name: 'None (JSON API)' }, ...WEB_VIEWS]

const LINTERS = [
  { value: 'biome', name: 'Biome' },
  { value: 'oxlint', name: 'Oxlint' },
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
    const flag = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
    const allowed = choices.map((choice) => choice.value).join(', ')
    throw new Error(`Invalid value "${value}" for --${flag}. Expected one of: ${allowed}.`)
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

  context.module = await resolveOption(context, 'module', {
    choices: MODULES,
    message: 'Which module system do you want?',
    fallback: 'esm',
  })

  context.example = await resolveOption(context, 'example', {
    choices: EXAMPLES,
    message: 'Which starter example do you want?',
    fallback: 'minimal',
  })

  // The web and mvc starters render server-side views, so they need an engine.
  const rendersViews = context.example === 'web' || context.example === 'mvc'
  context.view = await resolveOption(context, 'view', {
    choices: rendersViews ? WEB_VIEWS : VIEWS,
    message: 'Which view engine do you want?',
    fallback: rendersViews ? 'ejs' : 'none',
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

  // Default to the package manager that launched the CLI, but let it be chosen.
  context.packageManager = await resolveOption(context, 'packageManager', {
    choices: PACKAGE_MANAGERS,
    message: 'Which package manager do you want to use?',
    fallback: getPackageManager(),
  })

  return context
}
