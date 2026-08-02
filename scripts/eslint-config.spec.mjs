import { ESLint } from 'eslint'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')
const appSourceRoot = join(repositoryRoot, 'packages/app/src')
const featuresRoot = join(appSourceRoot, 'features')

let eslint

beforeAll(() => {
  eslint = new ESLint({
    cache: false,
    cwd: repositoryRoot,
    overrideConfigFile: join(repositoryRoot, 'eslint.config.ts'),
  })
})

afterAll(() => {
  eslint = undefined
})

const toImportSpecifier = (fromFile, toFile) => {
  const specifier = relative(dirname(fromFile), toFile).split(sep).join('/')
  return specifier.startsWith('.') ? specifier : `./${specifier}`
}

const makeTemporaryDirectory = async (parent) => {
  await mkdir(parent, { recursive: true })
  return mkdtemp(join(parent, '__eslint-config-test-'))
}

const lintFile = async (filePath) => {
  const [result] = await eslint.lintFiles([relative(repositoryRoot, filePath)])
  return result.messages
}

const lintTemporaryDependency = async ({
  extensionless = false,
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
  const importSpecifier = toImportSpecifier(fromFile, toFile)
  const sourceSpecifier = extensionless ? importSpecifier.replace(/\.ts$/, '') : importSpecifier
  await writeFile(fromFile, `import dependency from '${sourceSpecifier}'\nvoid dependency\n`)
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

const lintText = async (filePath, text) => {
  const [result] = await eslint.lintText(text, {
    filePath: relative(repositoryRoot, filePath),
  })
  return result.messages
}

const expectBoundaryMessage = (messages, expectedMessage) => {
  expect(messages[0]).toMatchObject({
    message: expect.stringContaining(expectedMessage),
    ruleId: 'boundaries/dependencies',
  })
}

describe('ESLint boundaries configuration', () => {
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

  it('reports an extensionless feature-type import', async () => {
    const messages = await lintTemporaryDependency({
      extensionless: true,
      fromParent: featuresRoot,
      fromPath: 'types/source.ts',
      sameRoot: true,
      toParent: featuresRoot,
      toPath: 'composables/target.ts',
    })

    expect(messages).toHaveLength(1)
    expectBoundaryMessage(messages, 'Feature types are compile-time only.')
  })

  it('keeps workspace types independent from composables', async () => {
    const messages = await lintFile(
      join(repositoryRoot, 'packages/app/src/features/markdown/types/workspace.ts'),
    )

    expect(messages).toEqual([])
  })

  it.each([
    [
      'packages/app/src/App.vue',
      '<script setup lang="ts">\nimport feature from \'./features/markdown/index.ts\'\nvoid feature\n</script>',
      'app-root',
    ],
    [
      'packages/app/src/createMarkdownStudioApp.ts',
      "import feature from './features/markdown/index.ts'\nvoid feature\n",
      'main',
    ],
  ])('classifies %s as a lean app entry point', async (filePath, source, category) => {
    const messages = await lintText(join(repositoryRoot, filePath), source)

    expectBoundaryMessage(messages, 'App entry points must stay lean.')
    expect(messages[0].message).toContain(`"${category}"`)
  })
})
