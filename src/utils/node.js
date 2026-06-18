/**
 * Whether a Node.js version runs TypeScript directly via unflagged native type
 * stripping, available since v22.18.0 (and all v23+/v24+).
 *
 * @param {string} version - e.g. `process.versions.node` ("24.16.0").
 * @returns {boolean}
 */
export function supportsNativeTypeStripping(version) {
  const [major, minor] = version.split('.').map(Number)
  return major > 22 || (major === 22 && minor >= 18)
}
