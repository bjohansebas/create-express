import { spawnSync } from 'node:child_process'
import { confirm } from '@inquirer/prompts'

export default async function installAction(context) {
  if (context.install === undefined) {
    context.install = await confirm({
      message: `Do you want to install dependencies with ${context.packageManager}?`,
      default: true,
    })
  }

  if (!context.install) {
    console.log('Skipped', 'Dependency installation')
    return
  }

  const result = spawnSync(context.packageManager, ['install'], {
    cwd: context.cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    context.install = false
    console.log('Failed to install dependencies. You can install them manually later.')
    return
  }

  console.log('Success!', 'Dependencies installed')
}
