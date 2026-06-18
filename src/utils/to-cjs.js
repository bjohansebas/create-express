function stripRelativeExtension(specifier) {
  return specifier.startsWith('.') ? specifier.replace(/\.(?:js|ts)$/, '') : specifier
}

/**
 * Replace the ESM `import.meta.url` directory idiom with `__dirname`, which is
 * available in CommonJS, and drop the now-unused `node:url` import.
 */
function replaceDirnameUsage(content) {
  return content
    .replace(/fileURLToPath\(new URL\('\.\/([^']+)', import\.meta\.url\)\)/g, "__dirname + '/$1'")
    .replace(/^import \{ fileURLToPath \} from 'node:url'\n/m, '')
}

function normalize(content) {
  return content.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n')
}

/**
 * Convert a single ESM source file to CommonJS.
 *
 * For `.ts` files the ESM `import`/`export` syntax is kept (tsc emits CommonJS
 * from it); only relative extensions and `import.meta.url` are adjusted. For
 * `.js` files the syntax itself is rewritten to `require`/`module.exports`.
 *
 * @param {string} content
 * @param {boolean} isTypeScript
 * @returns {string}
 */
export function toCommonJs(content, isTypeScript) {
  // Normalize CRLF (e.g. from a Windows checkout) so the line-based regexes match.
  const withDirname = replaceDirnameUsage(content.replace(/\r\n/g, '\n'))

  if (isTypeScript) {
    return normalize(
      withDirname.replace(/from '(\.[^']*)'/g, (_match, specifier) => `from '${stripRelativeExtension(specifier)}'`),
    )
  }

  const exported = []
  const rewritten = withDirname
    .replace(
      /^import (\w+) from '([^']+)'$/gm,
      (_match, name, specifier) => `const ${name} = require('${stripRelativeExtension(specifier)}')`,
    )
    .replace(
      /^import \{ ([^}]+) \} from '([^']+)'$/gm,
      (_match, names, specifier) => `const { ${names} } = require('${stripRelativeExtension(specifier)}')`,
    )
    .replace(/^export default /gm, 'module.exports = ')
    .replace(/^export (const|function|class) (\w+)/gm, (_match, keyword, name) => {
      exported.push(name)
      return `${keyword} ${name}`
    })

  if (exported.length === 0) {
    return normalize(rewritten)
  }

  return `${normalize(rewritten).trimEnd()}\n\nmodule.exports = { ${exported.join(', ')} }\n`
}
