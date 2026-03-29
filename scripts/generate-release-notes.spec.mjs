import { describe, expect, it } from 'vitest'

import {
  allowedReleaseNoteScopes,
  extractChangelogSection,
  groupCommitSubjectsByScope,
  parseConventionalCommitSubject,
  renderCommitsByScopeSection,
  renderContributorsSection,
  renderReleaseNotes,
  resolveGitHubUsername,
  shouldIncludeCommitSubject,
} from './generate-release-notes.mjs'

describe('extractChangelogSection', () => {
  it('returns the requested version section without the version heading', () => {
    const source = `# package

## 0.3.0

### Minor Changes

- Add desktop release notes

## 0.2.0

### Patch Changes

- Previous release
`

    expect(extractChangelogSection(source, '0.3.0')).toBe(`### Minor Changes

- Add desktop release notes`)
  })

  it('throws when the requested version is missing', () => {
    expect(() => extractChangelogSection('# package', '9.9.9')).toThrow(
      'Could not find changelog section for version 9.9.9.',
    )
  })
})

describe('renderReleaseNotes', () => {
  it('renders the changelog section without a title heading', () => {
    const releaseNotes = renderReleaseNotes({
      changelogSource: `# package

## 0.3.0

### Patch Changes

- Keep npm notes artifact-specific
`,
      version: '0.3.0',
    })

    expect(releaseNotes).toBe(`### Patch Changes

- Keep npm notes artifact-specific`)
  })
})

describe('parseConventionalCommitSubject', () => {
  it('exposes the supported release-note scopes', () => {
    expect(allowedReleaseNoteScopes).toEqual([
      'app',
      'ci',
      'cli',
      'desktop',
      'electron',
      'export',
      'landing-page',
      'markdown',
    ])
  })

  it('extracts type, scope, and description from a scoped conventional commit', () => {
    expect(parseConventionalCommitSubject('feat(export): add PDF export')).toEqual({
      description: 'add PDF export',
      rawScope: 'export',
      scope: 'export',
      subject: 'feat(export): add PDF export',
      type: 'feat',
    })
  })

  it('falls back to general scope when the subject has no explicit scope', () => {
    expect(parseConventionalCommitSubject('feat: update og url')).toEqual({
      description: 'update og url',
      rawScope: null,
      scope: 'general',
      subject: 'feat: update og url',
      type: 'feat',
    })
  })

  it('normalizes aliased scopes into the supported buckets', () => {
    expect(parseConventionalCommitSubject('fix(workflows): clean up release flow')).toEqual({
      description: 'clean up release flow',
      rawScope: 'workflows',
      scope: 'ci',
      subject: 'fix(workflows): clean up release flow',
      type: 'fix',
    })

    expect(parseConventionalCommitSubject('fix(markdown-editor): improve toolbar')).toEqual({
      description: 'improve toolbar',
      rawScope: 'markdown-editor',
      scope: 'markdown',
      subject: 'fix(markdown-editor): improve toolbar',
      type: 'fix',
    })
  })

  it('places unsupported scopes in the other bucket', () => {
    expect(parseConventionalCommitSubject('fix(router): clean up history mode')).toEqual({
      description: 'clean up history mode',
      rawScope: 'router',
      scope: 'other',
      subject: 'fix(router): clean up history mode',
      type: 'fix',
    })
  })

  it('places non-conventional subjects in the other scope', () => {
    expect(parseConventionalCommitSubject('Merge branch main into release')).toEqual({
      description: 'Merge branch main into release',
      rawScope: null,
      scope: 'other',
      subject: 'Merge branch main into release',
      type: 'other',
    })
  })
})

describe('shouldIncludeCommitSubject', () => {
  it('filters release-chore commits from release notes', () => {
    expect(shouldIncludeCommitSubject('chore(release): version packages')).toBe(false)
    expect(shouldIncludeCommitSubject('chore(release): prepare v0.2.0')).toBe(false)
  })

  it('keeps non-release chores and product commits', () => {
    expect(shouldIncludeCommitSubject('chore(cli): standardize package metadata')).toBe(true)
    expect(shouldIncludeCommitSubject('feat(export): add PDF export')).toBe(true)
  })
})

describe('groupCommitSubjectsByScope', () => {
  it('groups and sorts commit subjects by scope', () => {
    expect(
      groupCommitSubjectsByScope([
        'fix(ci): remove redundant token',
        'feat(export): add PDF export',
        'feat: update og url',
      ]),
    ).toEqual([
      {
        entries: [
          {
            description: 'remove redundant token',
            rawScope: 'ci',
            scope: 'ci',
            subject: 'fix(ci): remove redundant token',
            type: 'fix',
          },
        ],
        scope: 'ci',
      },
      {
        entries: [
          {
            description: 'add PDF export',
            rawScope: 'export',
            scope: 'export',
            subject: 'feat(export): add PDF export',
            type: 'feat',
          },
        ],
        scope: 'export',
      },
      {
        entries: [
          {
            description: 'update og url',
            rawScope: null,
            scope: 'general',
            subject: 'feat: update og url',
            type: 'feat',
          },
        ],
        scope: 'general',
      },
    ])
  })
})

describe('renderCommitsByScopeSection', () => {
  it('renders grouped commit subjects as markdown', () => {
    expect(
      renderCommitsByScopeSection([
        'chore(release): version packages',
        'fix(ci): remove redundant token',
        'feat(export): add PDF export',
        'feat: update og url',
      ]),
    ).toBe(`## Commits by scope

### ci
- fix(ci): remove redundant token

### export
- feat(export): add PDF export

### general
- feat: update og url`)
  })

  it('renders an empty-state message when no commits are available', () => {
    expect(renderCommitsByScopeSection([])).toBe(`## Commits by scope

_No matching commits found for this release range._`)
  })
})

describe('resolveGitHubUsername', () => {
  it('extracts the username from the new-style noreply email', () => {
    expect(resolveGitHubUsername('41898282+github-actions[bot]@users.noreply.github.com')).toBe(
      'github-actions[bot]',
    )
  })

  it('extracts the username from the old-style noreply email', () => {
    expect(resolveGitHubUsername('octocat@users.noreply.github.com')).toBe('octocat')
  })

  it('returns null for regular email addresses', () => {
    expect(resolveGitHubUsername('user@example.com')).toBeNull()
  })
})

describe('renderContributorsSection', () => {
  it('renders contributors with GitHub usernames as clickable links', () => {
    expect(
      renderContributorsSection([
        {
          email: '41898282+github-actions[bot]@users.noreply.github.com',
          name: 'GitHub Actions',
          username: 'github-actions[bot]',
        },
        {
          email: '123456+theoklitosBam7@users.noreply.github.com',
          name: 'Theoklitos Bampouris',
          username: 'theoklitosBam7',
        },
      ]),
    ).toBe(`## Contributors
- [@github-actions[bot]](https://github.com/github-actions[bot]) (GitHub Actions)
- [@theoklitosBam7](https://github.com/theoklitosBam7) (Theoklitos Bampouris)`)
  })

  it('renders contributors without a username as plain names', () => {
    expect(
      renderContributorsSection([{ email: 'john@example.com', name: 'John Doe', username: null }]),
    ).toBe(`## Contributors
- John Doe`)
  })

  it('renders an empty-state message when no contributors are available', () => {
    expect(renderContributorsSection([])).toBe(`## Contributors

_No contributors found for this release range._`)
  })
})
