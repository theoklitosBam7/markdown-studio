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
  'common',
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
  version,
}) {
  const changelogSource = await readFile(changelogPath, 'utf8')
  const previousTag = await findPreviousArtifactTag({ currentTag, ref, tagPattern })
  const commitSubjects = await getCommitSubjectsSinceTag({ previousTag, ref })
  const contributors = await getContributors({ previousTag, ref })
  const changelogNotes = renderReleaseNotes({ changelogSource, version })
  const commitsByScope = renderCommitsByScopeSection(commitSubjects)
  const contributorsSection = renderContributorsSection(contributors)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    `${[changelogNotes, commitsByScope, contributorsSection].join('\n\n')}\n`,
    'utf8',
  )
}

export async function getCommitSubjectsSinceTag({ previousTag, ref }) {
  const revisionRange = previousTag ? `${previousTag}..${ref}` : ref
  const stdout = await runGit(['log', '--format=%s', revisionRange])

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function getContributors({ previousTag, ref }) {
  const revisionRange = previousTag ? `${previousTag}..${ref}` : ref
  const stdout = await runGit(['log', '--format=%aN%x00%aE', revisionRange])

  const authors = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email] = line.split('\0')
      return { email, name }
    })

  const seen = new Set()
  const uniqueAuthors = []
  for (const author of authors) {
    if (!seen.has(author.email)) {
      seen.add(author.email)
      uniqueAuthors.push(author)
    }
  }

  return uniqueAuthors.map((author) => ({
    ...author,
    username: resolveGitHubUsername(author.email),
  }))
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

export function renderContributorsSection(contributors) {
  if (contributors.length === 0) {
    return '## Contributors\n\n_No contributors found for this release range._'
  }

  const lines = ['## Contributors']
  for (const c of contributors) {
    if (c.username) {
      lines.push(`- [@${c.username}](https://github.com/${c.username}) (${c.name})`)
    } else {
      lines.push(`- ${c.name}`)
    }
  }

  return lines.join('\n')
}

export function renderReleaseNotes({ changelogSource, version }) {
  return extractChangelogSection(changelogSource, version)
}

export function resolveGitHubUsername(email) {
  const match = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/)
  return match ? match[1] : null
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
    !args.version
  ) {
    throw new Error(
      'Usage: node ./scripts/generate-release-notes.mjs --changelog <path> --version <version> --current-tag <tag> --tag-pattern <pattern> --ref <git-ref> --output <path>',
    )
  }

  return args
}

async function runGit(args) {
  const { stdout } = await execFile('git', args, { cwd: rootDir })
  return stdout.trim()
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { changelog, currentTag, output, ref, tagPattern, version } = parseArgs(
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
    version,
  })
}
