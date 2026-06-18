export function getContext(projectName, options) {
  const context = {
    projectName,
    cwd: undefined,
    language: options.language,
    module: options.module,
    example: options.example,
    view: options.view,
    linter: options.linter,
    test: options.test,
    git: options.git,
    install: options.install,
    yes: options.yes ?? false,
    packageManager: options.packageManager,
  }

  return context
}
