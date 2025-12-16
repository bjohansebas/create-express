import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { confirm } from '@inquirer/prompts'

export default async function gitAction(context) {
  if (existsSync(resolve(context.cwd, '.git'))) {
    console.log('Nice!', `Git has already been initialized in this directory`)
    return
  }

  if (context.git === undefined) {
    const git = await confirm({
      message: 'Do you want to initialize a git repository?',
      default: true,
    })
    context.git = git
  }

  if (context.git) {
    init(context)
    console.log('Success!', `Git repository initialized`)
  } else {
    console.log('Skipped', `Git repository not initialized`)
  }
}

export function init({ cwd }) {
  spawn('git', ['init'], { stdio: 'ignore', cwd })
  spawn('git', ['add', '-A'], { stdio: 'ignore', cwd })
  spawn('git', ['commit', '-m', '"feat: create project with create-express"'], { cwd, stdio: 'ignore' })
}
