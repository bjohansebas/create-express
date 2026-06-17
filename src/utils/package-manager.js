/**
 * Parse the `npm_config_user_agent` environment variable to find out which
 * package manager invoked the CLI.
 *
 * @param {string | undefined} userAgent - Usually `process.env.npm_config_user_agent`.
 * @returns {{ name: string, version: string } | undefined}
 */
export function pkgFromUserAgent(userAgent) {
  if (!userAgent) {
    return undefined
  }

  const [pkgSpec] = userAgent.split(' ')
  const [name, version] = pkgSpec.split('/')

  return { name, version }
}

/**
 * Resolve the package manager that should be used for the generated project,
 * falling back to npm when it can't be detected.
 *
 * @returns {string} One of `npm`, `pnpm`, `yarn` or `bun`.
 */
export function getPackageManager() {
  const info = pkgFromUserAgent(process.env.npm_config_user_agent)
  return info?.name ?? 'npm'
}
