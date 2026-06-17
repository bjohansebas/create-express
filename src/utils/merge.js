function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Recursively merge `source` into `target`. Plain objects are merged deeply;
 * any other value (scalars, arrays) from `source` overrides `target`.
 *
 * @template T
 * @param {T} target
 * @param {Partial<T>} source
 * @returns {T}
 */
export function deepMerge(target, source) {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = result[key]

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      result[key] = sourceValue
    }
  }

  return result
}

/**
 * Sort the dependency maps of a package.json alphabetically, the way npm does
 * when it writes the manifest.
 *
 * @param {Record<string, unknown>} pkg
 * @returns {Record<string, unknown>}
 */
export function sortDependencies(pkg) {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[field]
    if (deps) {
      pkg[field] = Object.fromEntries(
        Object.keys(deps)
          .sort()
          .map((name) => [name, deps[name]]),
      )
    }
  }

  return pkg
}
