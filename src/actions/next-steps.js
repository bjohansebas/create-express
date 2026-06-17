import { relative } from 'node:path'

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
  console.log(`  ${run} dev\n`)
}
