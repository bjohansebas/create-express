import { bold, cyan, yellow } from 'picocolors'
import checkForUpdate from 'update-check'

import packageJson from '../../package.json'

export async function checkUpdates(): Promise<void> {
  const userAgent = process.env.npm_config_user_agent || ''

  let packageManager = 'npm'

  if (userAgent.startsWith('yarn')) packageManager = 'yarn'

  if (userAgent.startsWith('pnpm')) packageManager = 'pnpm'

  if (userAgent.startsWith('bun')) packageManager = 'bun'

  try {
    const res = await checkForUpdate(packageJson).catch(() => null)

    if (res?.latest) {
      const updateMessage =
        packageManager === 'yarn'
          ? 'yarn global add create-express'
          : packageManager === 'pnpm'
            ? 'pnpm add -g create-express'
            : packageManager === 'bun'
              ? 'bun add -g create-express'
              : 'npm i -g create-express'

      console.log(
        `\n${yellow(bold('A new version of `create-express` is available!'))}\n\nYou can update by running: ${cyan(updateMessage)}\n`,
      )
    }

    process.exit()
  } catch {
    // ignore error
  }
}