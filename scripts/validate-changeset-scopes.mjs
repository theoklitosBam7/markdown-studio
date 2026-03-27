#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const changesetDir = path.join(rootDir, '.changeset')
export const allowedPackages = new Set(['@markdown-studio/desktop', 'markdown-studio'])

export function parseReleaseLine(releaseLine) {
  const match = releaseLine.match(/^(['"]?)([^'"]+?)\1\s*:\s*(major|minor|patch)\s*$/)

  if (!match) {
    throw new Error(`Unsupported changeset entry "${releaseLine}".`)
  }

  const [, , packageName, releaseType] = match

  return { packageName, releaseType }
}

export async function validateChangesetScopes() {
  const entries = await readdir(changesetDir, { withFileTypes: true })
  const changesetFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map((entry) => path.join(changesetDir, entry.name))

  for (const changesetFile of changesetFiles) {
    const source = await readFile(changesetFile, 'utf8')
    validateChangesetSource(source, path.relative(rootDir, changesetFile))
  }

  return changesetFiles.length
}

export function validateChangesetSource(source, relativePath) {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/)

  if (!frontmatterMatch) {
    throw new Error(`Missing frontmatter in ${relativePath}.`)
  }

  const releaseLines = frontmatterMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (releaseLines.length === 0) {
    throw new Error(`No package releases declared in ${relativePath}.`)
  }

  for (const releaseLine of releaseLines) {
    let packageName

    try {
      ;({ packageName } = parseReleaseLine(releaseLine))
    } catch {
      throw new Error(`Unsupported changeset entry "${releaseLine}" in ${relativePath}.`)
    }

    if (!allowedPackages.has(packageName)) {
      throw new Error(
        `Disallowed package "${packageName}" in ${relativePath}. Allowed packages: ${[...allowedPackages].join(', ')}.`,
      )
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const validatedFileCount = await validateChangesetScopes()
  console.log(`Validated ${validatedFileCount} changeset file(s).`)
}
