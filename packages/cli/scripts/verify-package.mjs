#!/usr/bin/env node

/**
 * Package verification script.
 *
 * Ensures all required files exist before packaging the CLI.
 * Throws an error if any required assets are missing.
 */

import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Root directory of the CLI package.
 */
const packageDir = fileURLToPath(new URL('..', import.meta.url))
const packageJsonPath = path.join(packageDir, 'package.json')
const expectedRepositoryUrl = 'https://github.com/theoklitosBam7/markdown-studio'

/**
 * List of required paths that must exist for a valid package.
 */
const requiredPaths = [
  packageJsonPath,
  path.join(packageDir, 'public/index.html'),
  path.join(packageDir, 'src/cli.ts'),
  path.join(packageDir, 'src/server.ts'),
]

// Verify each required path exists
for (const requiredPath of requiredPaths) {
  try {
    await access(requiredPath)
  } catch {
    throw new Error(
      `Missing required package asset: ${requiredPath}. Run "pnpm build:npm" from the repository root before packing.`,
    )
  }
}

/**
 * @typedef {{
 *   bugs?: { url?: string }
 *   homepage?: string
 *   repository?: { directory?: string, type?: string, url?: string } | string
 * }} PackageJsonMetadata
 */

/** @type {PackageJsonMetadata} */
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

const repositoryUrl =
  typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url

if (repositoryUrl !== expectedRepositoryUrl) {
  throw new Error(
    `Invalid package repository URL: expected "${expectedRepositoryUrl}", received "${repositoryUrl ?? ''}".`,
  )
}

if (packageJson.homepage !== `${expectedRepositoryUrl}#readme`) {
  throw new Error(
    `Invalid package homepage: expected "${expectedRepositoryUrl}#readme", received "${packageJson.homepage ?? ''}".`,
  )
}

if (packageJson.bugs?.url !== `${expectedRepositoryUrl}/issues`) {
  throw new Error(
    `Invalid package bugs URL: expected "${expectedRepositoryUrl}/issues", received "${packageJson.bugs?.url ?? ''}".`,
  )
}
