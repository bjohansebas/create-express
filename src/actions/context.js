import { getPackageManager } from '../utils/package-manager.js'

export function getContext(projectName, options) {
  const context = {
    projectName,
    cwd: undefined,
    language: options.language,
    example: options.example,
    view: options.view,
    linter: options.linter,
    test: options.test,
    git: options.git,
    install: options.install,
    yes: options.yes ?? false,
    packageManager: getPackageManager(),
  }

  return context
}
