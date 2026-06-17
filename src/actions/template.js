import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATES_DIR = fileURLToPath(new URL('../../templates', import.meta.url))

// Files shipped with a leading underscore so they aren't interpreted while the
// template lives inside this package; they are restored on copy.
const RENAME_FILES = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

const IGNORED_ENTRIES = new Set(['node_modules'])

function copyDir(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true })

  for (const entry of readdirSync(srcDir)) {
    if (IGNORED_ENTRIES.has(entry)) {
      continue
    }

    const srcPath = join(srcDir, entry)
    const destPath = join(destDir, RENAME_FILES[entry] ?? entry)

    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

export default async function templateAction(context) {
  const srcDir = join(TEMPLATES_DIR, context.template)

  if (!existsSync(srcDir)) {
    throw new Error(`Template "${context.template}" does not exist.`)
  }

  copyDir(srcDir, context.cwd)

  const pkgPath = join(context.cwd, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.name = context.projectName
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  console.log('Success!', `Project created from the "${context.template}" template`)
}
