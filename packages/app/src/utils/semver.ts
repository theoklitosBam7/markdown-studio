import semver from 'semver'

/**
 * Compare two semver version strings.
 *
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  return semver.compare(a, b)
}
