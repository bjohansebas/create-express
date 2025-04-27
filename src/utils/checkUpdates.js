const checkForUpdate = require('update-check')
const packageJson = require('../../package.json')

exports = async function checkUpdates() {
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
        `\n'A new version of 'create-express' is available!'\n\nYou can update by running: ${updateMessage}\n`,
      )
    }

    process.exit()
  } catch {
    // ignore error
  }
}