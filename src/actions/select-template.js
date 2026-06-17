import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { select } from '@inquirer/prompts'

const TEMPLATES_DIR = fileURLToPath(new URL('../../templates', import.meta.url))

const TEMPLATES = [
  { value: 'minimal-typescript', name: 'TypeScript' },
  { value: 'minimal', name: 'JavaScript' },
]

export default async function selectTemplateAction(context) {
  if (context.template) {
    if (!existsSync(join(TEMPLATES_DIR, context.template))) {
      throw new Error(`Template "${context.template}" does not exist.`)
    }
    return context.template
  }

  if (context.typescript) {
    context.template = 'minimal-typescript'
    return context.template
  }

  if (context.javascript) {
    context.template = 'minimal'
    return context.template
  }

  context.template = await select({
    message: 'Which language do you want to use?',
    choices: TEMPLATES,
    default: 'minimal-typescript',
  })

  return context.template
}
