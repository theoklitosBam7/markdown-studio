const releaseNoteScopes = [
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
]

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', releaseNoteScopes],
  },
}
