import semver from 'semver'

/**
 * Compare two semver version strings.
 *
 * Accepts plain versions (1.2.3), v-prefixed (v1.2.3), and
 * tagged formats like desktop-v1.2.3.
 *
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  return semver.compare(coerce(a), coerce(b))
}

/**
 * Normalize a version string by extracting the semver portion.
 * Handles plain versions (1.2.3), v-prefix (v1.2.3), and
 * tagged formats like desktop-v1.2.3.
 */
function coerce(version: string): string {
  const coerced = semver.coerce(version)
  if (!coerced) {
    throw new Error(`Invalid semver: "${version}"`)
  }
  return coerced.version
}
