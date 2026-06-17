import { getPackageManager } from '../utils/package-manager.js'

export function getContext(projectName, options) {
  const context = {
    projectName,
    cwd: undefined,
    template: options.template,
    typescript: options.typescript,
    javascript: options.javascript,
    git: options.git,
    install: options.install,
    packageManager: getPackageManager(),
  }

  return context
}
