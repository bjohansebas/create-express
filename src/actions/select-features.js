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

const EXAMPLES = [
  { value: 'minimal', name: 'Minimal (Hello World)' },
  { value: 'api', name: 'REST API (JSON)' },
  { value: 'web', name: 'Web app (views + static)' },
  { value: 'mvc', name: 'Structured / MVC' },
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

  context.example = await resolveOption(context, 'example', {
    choices: EXAMPLES,
    message: 'Which starter example do you want?',
    fallback: 'minimal',
  })

  // Default to the package manager that launched the CLI, but let it be chosen.
  context.packageManager = await resolveOption(context, 'packageManager', {
    choices: PACKAGE_MANAGERS,
    message: 'Which package manager do you want to use?',
    fallback: getPackageManager(),
  })

  return context
}
