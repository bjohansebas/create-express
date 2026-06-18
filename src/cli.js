/**
 * Map the raw commander options into the option object consumed by the actions
 * pipeline. `getOptionSource` is `command.getOptionValueSource`, used to tell an
 * explicitly-passed flag from a default, so git/install can fall back to a
 * prompt when the user didn't choose.
 *
 * @param {Record<string, unknown>} options
 * @param {(name: string) => string} getOptionSource
 */
export function resolveOptions(options, getOptionSource) {
  const explicit = (name) => (getOptionSource(name) === 'default' ? undefined : options[name])

  let language
  if (options.typescript) {
    language = 'ts'
  }
  if (options.javascript) {
    language = 'js'
  }

  let moduleSystem
  if (options.esm) {
    moduleSystem = 'esm'
  }
  if (options.cjs) {
    moduleSystem = 'cjs'
  }

  return {
    language,
    module: moduleSystem,
    example: options.example,
    view: options.view,
    linter: options.linter,
    test: options.test,
    packageManager: options.packageManager,
    git: explicit('git'),
    install: explicit('install'),
    force: options.force,
    yes: options.yes,
  }
}

/**
 * Normalize a thrown value into a user-facing message, flagging the case where
 * the user aborted an interactive prompt (e.g. Ctrl+C).
 *
 * @param {unknown} error
 * @returns {{ aborted: boolean, message: string }}
 */
export function formatError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    return { aborted: true, message: 'Aborted.' }
  }

  return { aborted: false, message: error instanceof Error ? error.message : String(error) }
}
