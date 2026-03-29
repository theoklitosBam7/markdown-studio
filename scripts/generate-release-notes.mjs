#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const execFile = promisify(execFileCallback)
export const allowedReleaseNoteScopes = [
  'app',
  'ci',
  'cli',
  'desktop',
  'electron',
  'export',
  'landing-page',
  'markdown',
]

const releaseNoteScopeAliases = new Map([
  ['markdown-editor', 'markdown'],
  ['useDocumentActions', 'markdown'],
  ['workflows', 'ci'],
])

export function extractChangelogSection(source, version) {
  const heading = `## ${version}`
  const startIndex = source.indexOf(heading)

  if (startIndex === -1) {
    throw new Error(`Could not find changelog section for version ${version}.`)
  }

  const contentStartIndex = startIndex + heading.length
  const nextHeadingIndex = source.indexOf('\n## ', contentStartIndex)
  const rawSection =
    nextHeadingIndex === -1
      ? source.slice(contentStartIndex)
      : source.slice(contentStartIndex, nextHeadingIndex)

  const section = rawSection.trim()

  if (!section) {
    throw new Error(`Changelog section for version ${version} is empty.`)
  }

  return section
}

export async function findPreviousArtifactTag({ currentTag, ref, tagPattern }) {
  const stdout = await runGit(['tag', '--merged', ref, '--list', tagPattern, '--sort=-v:refname'])
  const tags = stdout
    .split('\n')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => tag !== currentTag)

  return tags[0] ?? null
}

export async function generateReleaseNotes({
  changelogPath,
  currentTag,
  outputPath,
  ref,
  tagPattern,
  title,
  version,
}) {
  const changelogSource = await readFile(changelogPath, 'utf8')
  const previousTag = await findPreviousArtifactTag({ currentTag, ref, tagPattern })
  const commitSubjects = await getCommitSubjectsSinceTag({ previousTag, ref })
  const commitsByScope = renderCommitsByScopeSection(commitSubjects)
  const changelogNotes = renderReleaseNotes({ changelogSource, title, version })

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${[changelogNotes, commitsByScope].join('\n\n')}\n`, 'utf8')
}

export async function getCommitSubjectsSinceTag({ previousTag, ref }) {
  const revisionRange = previousTag ? `${previousTag}..${ref}` : ref
  const stdout = await runGit(['log', '--format=%s', revisionRange])

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function groupCommitSubjectsByScope(subjects) {
  const groups = new Map()

  for (const subject of subjects) {
    if (!shouldIncludeCommitSubject(subject)) continue

    const entry = parseConventionalCommitSubject(subject)
    const scopeEntries = groups.get(entry.scope) ?? []
    scopeEntries.push(entry)
    groups.set(entry.scope, scopeEntries)
  }

  return [...groups.entries()]
    .sort(([leftScope], [rightScope]) => leftScope.localeCompare(rightScope))
    .map(([scope, entries]) => ({
      entries,
      scope,
    }))
}

export function parseConventionalCommitSubject(subject) {
  const match = subject.match(/^([a-z]+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i)

  if (!match) {
    return {
      description: subject,
      rawScope: null,
      scope: 'other',
      subject,
      type: 'other',
    }
  }

  const [, type, scope, , description] = match
  const normalizedScope = normalizeReleaseNoteScope(scope || null)

  return {
    description,
    rawScope: scope || null,
    scope: normalizedScope,
    subject,
    type: type.toLowerCase(),
  }
}

export function renderCommitsByScopeSection(subjects) {
  if (subjects.length === 0) {
    return '## Commits by scope\n\n_No matching commits found for this release range._'
  }

  const groups = groupCommitSubjectsByScope(subjects)
  const lines = ['## Commits by scope']

  for (const group of groups) {
    lines.push('', `### ${group.scope}`)

    for (const entry of group.entries) {
      lines.push(`- ${entry.subject}`)
    }
  }

  return lines.join('\n')
}

export function renderReleaseNotes({ changelogSource, title, version }) {
  const section = extractChangelogSection(changelogSource, version)

  return [`# ${title}`, '', section].join('\n')
}

export function shouldIncludeCommitSubject(subject) {
  const entry = parseConventionalCommitSubject(subject)

  return !(entry.type === 'chore' && entry.rawScope === 'release')
}

function normalizeReleaseNoteScope(scope) {
  if (!scope) return 'general'

  const aliasedScope = releaseNoteScopeAliases.get(scope) ?? scope

  if (allowedReleaseNoteScopes.includes(aliasedScope)) {
    return aliasedScope
  }

  return 'other'
}

function parseArgs(argv) {
  const args = {
    changelog: '',
    currentTag: '',
    output: '',
    ref: 'HEAD',
    tagPattern: '',
    title: '',
    version: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const value = argv[index + 1]

    if (arg === '--changelog') {
      args.changelog = value ?? ''
      index += 1
      continue
    }

    if (arg === '--output') {
      args.output = value ?? ''
      index += 1
      continue
    }

    if (arg === '--current-tag') {
      args.currentTag = value ?? ''
      index += 1
      continue
    }

    if (arg === '--ref') {
      args.ref = value ?? ''
      index += 1
      continue
    }

    if (arg === '--tag-pattern') {
      args.tagPattern = value ?? ''
      index += 1
      continue
    }

    if (arg === '--title') {
      args.title = value ?? ''
      index += 1
      continue
    }

    if (arg === '--version') {
      args.version = value ?? ''
      index += 1
      continue
    }
  }

  if (
    !args.changelog ||
    !args.currentTag ||
    !args.output ||
    !args.ref ||
    !args.tagPattern ||
    !args.title ||
    !args.version
  ) {
    throw new Error(
      'Usage: node ./scripts/generate-release-notes.mjs --changelog <path> --version <version> --title <title> --current-tag <tag> --tag-pattern <pattern> --ref <git-ref> --output <path>',
    )
  }

  return args
}

async function runGit(args) {
  const { stdout } = await execFile('git', args, { cwd: rootDir })
  return stdout.trim()
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { changelog, currentTag, output, ref, tagPattern, title, version } = parseArgs(
    process.argv.slice(2),
  )
  const changelogPath = path.resolve(rootDir, changelog)
  const outputPath = path.resolve(rootDir, output)

  await generateReleaseNotes({
    changelogPath,
    currentTag,
    outputPath,
    ref,
    tagPattern,
    title,
    version,
  })
}
