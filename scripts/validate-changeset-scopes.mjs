#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const changesetDir = path.join(rootDir, '.changeset')
const allowedPackages = new Set(['@markdown-studio/desktop', 'markdown-studio'])

const entries = await readdir(changesetDir, { withFileTypes: true })
const changesetFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
  .map((entry) => path.join(changesetDir, entry.name))

for (const changesetFile of changesetFiles) {
  const source = await readFile(changesetFile, 'utf8')
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/)

  if (!frontmatterMatch) {
    throw new Error(`Missing frontmatter in ${path.relative(rootDir, changesetFile)}.`)
  }

  const releaseLines = frontmatterMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (releaseLines.length === 0) {
    throw new Error(`No package releases declared in ${path.relative(rootDir, changesetFile)}.`)
  }

  for (const releaseLine of releaseLines) {
    const match = releaseLine.match(/^"?([^"]+?)"?\s*:\s*(major|minor|patch)\s*$/)

    if (!match) {
      throw new Error(
        `Unsupported changeset entry "${releaseLine}" in ${path.relative(rootDir, changesetFile)}.`,
      )
    }

    const [, packageName] = match

    if (!allowedPackages.has(packageName)) {
      throw new Error(
        `Disallowed package "${packageName}" in ${path.relative(rootDir, changesetFile)}. Allowed packages: ${[...allowedPackages].join(', ')}.`,
      )
    }
  }
}

console.log(`Validated ${changesetFiles.length} changeset file(s).`)
