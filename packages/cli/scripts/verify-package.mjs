#!/usr/bin/env node

/**
 * Package verification script.
 *
 * Ensures all required files exist before packaging the CLI.
 * Throws an error if any required assets are missing.
 */

import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Root directory of the CLI package.
 */
const packageDir = fileURLToPath(new URL('..', import.meta.url))

/**
 * List of required paths that must exist for a valid package.
 */
const requiredPaths = [
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
