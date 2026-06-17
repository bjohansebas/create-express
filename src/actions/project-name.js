import { existsSync, mkdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { input } from '@inquirer/prompts'
import validate from 'validate-npm-package-name'
import { isEmpty } from '../utils/os.js'

const DEFAULT_DIR = 'my-express-server'

/**
 * Coerce an arbitrary directory name into a valid npm package name.
 *
 * @param {string} name
 * @returns {string}
 */
export function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]+/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

async function promptDirectory() {
  return input({
    message: 'Where should we create your project?',
    default: DEFAULT_DIR,
  })
}

export default async function projectNameAction(context) {
  let targetDir = context.projectName?.trim()
  if (!targetDir) {
    targetDir = context.yes ? DEFAULT_DIR : await promptDirectory()
  }

  while (isEmpty(targetDir) === false) {
    if (context.yes) {
      throw new Error(`The directory "${targetDir}" is not empty.`)
    }
    console.log(`The directory "${targetDir}" is not empty. Please choose a different location.`)
    targetDir = await promptDirectory()
  }

  // The package name is derived from the final path segment, never the whole path.
  let packageName = basename(resolve(targetDir))

  // Like create-vite: only prompt when the derived name isn't valid, and offer
  // the sanitized version as the default so the rename is visible and editable.
  if (validate(packageName).validForNewPackages === false) {
    if (context.yes) {
      const sanitized = toValidPackageName(packageName)
      packageName = validate(sanitized).validForNewPackages ? sanitized : DEFAULT_DIR
    } else {
      packageName = await input({
        message: 'What is the name of your project?',
        default: toValidPackageName(packageName),
        validate: (name) => {
          const result = validate(name)
          if (result.validForNewPackages) {
            return true
          }
          return [...(result.errors ?? []), ...(result.warnings ?? [])][0] ?? 'Invalid npm package name'
        },
      })
    }
  }

  context.cwd = resolve(targetDir)
  context.projectName = packageName

  if (!existsSync(context.cwd)) {
    mkdirSync(context.cwd, { recursive: true })
  }

  return context
}
