import { relative } from 'node:path'

// Express wordmark (figlet "Standard") + handy links, printed once the whole
// process is done.
const EXPRESS_LOGO = [
  '',
  ' _____                              ',
  '| ____|_  ___ __  _ __ ___  ___ ___ ',
  "|  _| \\ \\/ / '_ \\| '__/ _ \\/ __/ __|",
  '| |___ >  <| |_) | | |  __/\\__ \\__ \\',
  '|_____/_/\\_\\ .__/|_|  \\___||___/___/',
  '           |_|                      ',
  '',
  '  Docs      https://expressjs.com',
  '  GitHub    https://github.com/expressjs/express',
  '',
].join('\n')

export default function nextStepsAction(context) {
  const pm = context.packageManager
  const dir = relative(process.cwd(), context.cwd) || '.'
  const run = pm === 'npm' ? 'npm run' : pm

  console.log('\nDone! Next steps:\n')

  if (dir !== '.') {
    console.log(`  cd ${dir}`)
  }
  if (!context.install) {
    console.log(`  ${pm} install`)
  }
  console.log(`  ${run} dev`)
  if (context.test && context.test !== 'none') {
    console.log(`  ${run} test`)
  }

  console.log(EXPRESS_LOGO)
}
