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
      'editor',
      'preview',
      'diagrams',
      'export',
      'file-operations',
      'command-palette',
      'workspace-drafts',
      'ui',
      'performance',
      'accessibility',
      'desktop',
      'web',
      'cli',
      'release',
      'testing',
      'docs',
      'general',
      'other',
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
      scope: 'release',
      subject: 'fix(workflows): clean up release flow',
      type: 'fix',
    })

    expect(parseConventionalCommitSubject('fix(markdown-editor): improve toolbar')).toEqual({
      description: 'improve toolbar',
      rawScope: 'markdown-editor',
      scope: 'editor',
      subject: 'fix(markdown-editor): improve toolbar',
      type: 'fix',
    })

    expect(parseConventionalCommitSubject('fix(useDocumentActions): handle save errors')).toEqual({
      description: 'handle save errors',
      rawScope: 'useDocumentActions',
      scope: 'file-operations',
      subject: 'fix(useDocumentActions): handle save errors',
      type: 'fix',
    })

    expect(parseConventionalCommitSubject('fix(ci): remove redundant token')).toEqual({
      description: 'remove redundant token',
      rawScope: 'ci',
      scope: 'release',
      subject: 'fix(ci): remove redundant token',
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

    expect(parseConventionalCommitSubject('feat(landing-page): update hero section')).toEqual({
      description: 'update hero section',
      rawScope: 'landing-page',
      scope: 'other',
      subject: 'feat(landing-page): update hero section',
      type: 'feat',
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

  it('includes ci-scoped commits under the release scope instead of filtering them', () => {
    expect(shouldIncludeCommitSubject('fix(ci): remove redundant token')).toBe(true)
    expect(shouldIncludeCommitSubject('fix(ci): remove redundant token', 'desktop')).toBe(true)
    expect(shouldIncludeCommitSubject('fix(ci): remove redundant token', 'npm')).toBe(true)
  })

  it('filters artifact-specific commits after aliasing scopes', () => {
    expect(shouldIncludeCommitSubject('fix(electron): handle native save dialog', 'desktop')).toBe(
      true,
    )
    expect(shouldIncludeCommitSubject('fix(web): refresh service worker', 'desktop')).toBe(false)
    expect(shouldIncludeCommitSubject('fix(electron): handle native save dialog', 'npm')).toBe(
      false,
    )
    expect(shouldIncludeCommitSubject('fix(router): clean up history mode', 'npm')).toBe(false)
  })
})

describe('groupCommitSubjectsByScope', () => {
  it('groups and sorts commit subjects by scope', () => {
    expect(
      groupCommitSubjectsByScope([
        'fix(workflows): remove redundant token',
        'feat(export): add PDF export',
        'feat: update og url',
      ]),
    ).toEqual([
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
            description: 'remove redundant token',
            rawScope: 'workflows',
            scope: 'release',
            subject: 'fix(workflows): remove redundant token',
            type: 'fix',
          },
        ],
        scope: 'release',
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

  it('excludes unknown scopes from artifact-specific groups', () => {
    expect(
      groupCommitSubjectsByScope(
        [
          'fix(router): clean up history mode',
          'fix(electron): handle native save dialog',
          'fix(web): refresh service worker',
        ],
        'desktop',
      ),
    ).toEqual([
      {
        entries: [
          {
            description: 'handle native save dialog',
            rawScope: 'electron',
            scope: 'desktop',
            subject: 'fix(electron): handle native save dialog',
            type: 'fix',
          },
        ],
        scope: 'desktop',
      },
    ])
  })
})

describe('renderCommitsByScopeSection', () => {
  it('renders grouped commit subjects as markdown', () => {
    expect(
      renderCommitsByScopeSection([
        'chore(release): version packages',
        'feat(export): add PDF export',
        'fix(workflows): remove redundant token',
        'feat: update og url',
      ]),
    ).toBe(`## Commits by scope

### Export
- feat(export): add PDF export

### Release
- fix(workflows): remove redundant token

### General
- feat: update og url`)
  })

  it('renders display headings and artifact filtering together', () => {
    expect(
      renderCommitsByScopeSection(
        [
          'fix(useDocumentActions): handle save errors',
          'fix(electron): handle native save dialog',
          'fix(web): refresh service worker',
        ],
        'npm',
      ),
    ).toBe(`## Commits by scope

### File operations
- fix(useDocumentActions): handle save errors

### Web
- fix(web): refresh service worker`)
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
