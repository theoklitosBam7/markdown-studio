import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vite-plus/test'

const execFileAsync = promisify(execFile)

const repositoryRoot = resolve(import.meta.dirname, '..')
const appSourceRoot = join(repositoryRoot, 'packages/app/src')
const featuresRoot = join(appSourceRoot, 'features')

const toImportSpecifier = (fromFile, toFile) => {
  const specifier = relative(dirname(fromFile), toFile).split(sep).join('/')
  return specifier.startsWith('.') ? specifier : `./${specifier}`
}

const makeTemporaryDirectory = async (parent) => {
  await mkdir(parent, { recursive: true })
  return mkdtemp(join(parent, '__lint-config-test-'))
}

const runLint = async (filePaths) => {
  const vpBinary = join(repositoryRoot, 'node_modules', '.bin', 'vp')
  const relativePaths = filePaths.map((filePath) => relative(repositoryRoot, filePath))

  // `vp lint` exits non-zero when it reports diagnostics; capture stdout either way.
  let stdout
  try {
    ;({ stdout } = await execFileAsync(vpBinary, ['lint', '--format=json', ...relativePaths], {
      cwd: repositoryRoot,
      maxBuffer: 64 * 1024 * 1024,
    }))
  } catch (error) {
    stdout = error.stdout
  }

  const output = JSON.parse(stdout)

  return (output.diagnostics ?? []).map((diagnostic) => ({
    message: diagnostic.message,
    ruleId: diagnostic.code,
  }))
}

const lintFile = (filePath) => runLint([filePath])

const lintTemporaryDependency = async ({
  fromParent,
  fromPath,
  sameRoot = false,
  toParent,
  toPath,
}) => {
  const roots = []
  const fromRoot = await makeTemporaryDirectory(fromParent)
  roots.push(fromRoot)

  const toRoot = sameRoot ? fromRoot : await makeTemporaryDirectory(toParent)
  if (!sameRoot) roots.push(toRoot)

  const fromFile = join(fromRoot, fromPath)
  const toFile = join(toRoot, toPath)
  await mkdir(dirname(fromFile), { recursive: true })
  await mkdir(dirname(toFile), { recursive: true })
  await writeFile(
    fromFile,
    `import dependency from '${toImportSpecifier(fromFile, toFile)}'\nvoid dependency\n`,
  )
  await writeFile(toFile, 'export default {}\n')

  try {
    return await lintFile(fromFile)
  } finally {
    await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })))
  }
}

const lintTemporaryExternalDependency = async ({ fromParent, fromPath, source }) => {
  const root = await makeTemporaryDirectory(fromParent)
  const fromFile = join(root, fromPath)
  await mkdir(dirname(fromFile), { recursive: true })
  await writeFile(fromFile, `import dependency from '${source}'\nvoid dependency\n`)

  try {
    return await lintFile(fromFile)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
}

const expectBoundaryMessage = (messages, expectedMessage) => {
  expect(messages[0]).toMatchObject({
    message: expect.stringContaining(expectedMessage),
    ruleId: 'boundaries(dependencies)',
  })
}

describe('Vite+ lint boundaries configuration', () => {
  it('allows a feature component to import a same-feature composable', async () => {
    const messages = await lintTemporaryDependency({
      fromParent: featuresRoot,
      fromPath: 'components/source.ts',
      sameRoot: true,
      toParent: featuresRoot,
      toPath: 'composables/target.ts',
    })

    expect(messages).toEqual([])
  })

  it('rejects a feature component importing a same-feature service', async () => {
    const messages = await lintTemporaryDependency({
      fromParent: featuresRoot,
      fromPath: 'components/source.ts',
      sameRoot: true,
      toParent: featuresRoot,
      toPath: 'services/target.ts',
    })

    expect(messages).toHaveLength(1)
    expectBoundaryMessage(messages, 'Feature components cannot call services directly.')
  })

  it('rejects imports between different features', async () => {
    const messages = await lintTemporaryDependency({
      fromParent: featuresRoot,
      fromPath: 'components/source.ts',
      toParent: featuresRoot,
      toPath: 'composables/target.ts',
    })

    expect(messages).toHaveLength(1)
    expectBoundaryMessage(messages, 'Cross-feature import detected!')
  })

  it.each([
    ['views', 'store', 'Views are orchestration layers.'],
    ['layouts', 'components', 'Layouts define page structure only.'],
    ['stores', 'components', 'Global stores handle cross-cutting concerns.'],
    ['services', 'components', 'Global services are infrastructure.'],
    ['composables', 'components', 'Global composables must stay generic.'],
    ['utils', 'components', 'Utils must be pure functions.'],
    ['types', 'utils', 'Types are compile-time only.'],
    ['router', 'components', 'Router defines routes only.'],
  ])('rejects a %s importing %s', async (fromLayer, toLayer, expectedMessage) => {
    const messages = await lintTemporaryDependency({
      fromParent: join(appSourceRoot, fromLayer),
      fromPath: 'source.ts',
      toParent: featuresRoot,
      toPath: `${toLayer}/target.ts`,
    })

    expect(messages).toHaveLength(1)
    expectBoundaryMessage(messages, expectedMessage)
  })

  it.each([
    ['store', 'Feature stores manage state only.'],
    ['services', 'Feature services handle API calls only.'],
    ['types', 'Feature types are compile-time only.'],
  ])(
    'rejects a feature %s importing a same-feature component',
    async (fromLayer, expectedMessage) => {
      const messages = await lintTemporaryDependency({
        fromParent: featuresRoot,
        fromPath: `${fromLayer}/source.ts`,
        sameRoot: true,
        toParent: featuresRoot,
        toPath: 'components/target.ts',
      })

      expect(messages).toHaveLength(1)
      expectBoundaryMessage(messages, expectedMessage)
    },
  )

  it.each([
    ['components', 'pinia', 'UI components must be pure.'],
    ['utils', 'vue', 'Utils must be pure TypeScript.'],
    ['types', 'vue', 'Types are compile-time only.'],
  ])(
    'rejects a %s importing the restricted external module %s',
    async (fromLayer, source, expectedMessage) => {
      const messages = await lintTemporaryExternalDependency({
        fromParent: join(appSourceRoot, fromLayer),
        fromPath: 'source.ts',
        source,
      })

      expect(messages).toHaveLength(1)
      expectBoundaryMessage(messages, expectedMessage)
    },
  )

  // NOTE: extensionless relative imports (caught previously via
  // eslint-import-resolver-typescript) are not resolved by the Oxlint boundaries
  // plugin, so that case is not asserted here.

  it('keeps workspace types independent from composables', async () => {
    const messages = await lintFile(
      join(repositoryRoot, 'packages/app/src/features/markdown/types/workspace.ts'),
    )

    expect(messages).toEqual([])
  })
})
