#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const version = process.argv[2]

if (!version) {
  console.error('Usage: node scripts/update-release-package-versions.mjs <version>')
  process.exit(1)
}

const packageJsonPaths = [
  './apps/desktop/package.json',
  './apps/landing-page/package.json',
  './apps/web/package.json',
  './packages/app/package.json',
  './packages/cli/package.json',
  './packages/desktop-contract/package.json',
]

await Promise.all(
  packageJsonPaths.map(async (packageJsonPath) => {
    const packageJsonUrl = new URL(packageJsonPath, `file://${process.cwd()}/`)
    const packageJson = JSON.parse(await readFile(packageJsonUrl, 'utf8'))

    packageJson.version = version

    await writeFile(packageJsonUrl, `${JSON.stringify(packageJson, null, 2)}\n`)
  }),
)
