#!/usr/bin/env node

/**
 * Distribution finalization script.
 *
 * Converts .js files to .mjs and rewrites internal imports to use .mjs extensions.
 * This ensures the package can be consumed as an ES module.
 */

import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Root directory of the CLI package.
 */
const packageDir = fileURLToPath(new URL('..', import.meta.url))

/**
 * Directory containing built distribution files.
 */
const distDir = path.join(packageDir, 'dist')

/**
 * Module files to convert from .js to .mjs.
 */
const moduleFiles = ['browser', 'cli', 'server']

// Process each module file
for (const moduleFile of moduleFiles) {
  const jsPath = path.join(distDir, `${moduleFile}.js`)
  const mjsPath = path.join(distDir, `${moduleFile}.mjs`)

  // Read the source file
  const source = await readFile(jsPath, 'utf8')

  // Rewrite internal .js imports to .mjs
  const rewritten = source.replaceAll(/(\.\/[\w-]+)\.js(['"])/g, '$1.mjs$2')

  // Write the rewritten content back
  await writeFile(jsPath, rewritten, 'utf8')

  // Remove existing .mjs if present
  await rm(mjsPath, { force: true })

  // Rename .js to .mjs
  await rename(jsPath, mjsPath)
}
