export function getContext(projectName, options) {
  const context = {
    projectName,
    cwd: undefined,
    language: options.language,
    example: options.example,
    view: options.view,
    linter: options.linter,
    docker: options.docker,
    git: options.git,
    install: options.install,
    force: options.force ?? false,
    yes: options.yes ?? false,
    packageManager: options.packageManager,
  }

  return context
}
