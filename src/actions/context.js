export function getContext(projectName, options) {
  const context = {
    projectName: projectName,
    cwd: projectName?.trim(),
    installDependencies: options.install ?? true,
    git: options.git,
  }

  return context
}
