import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const nanoStagedBin = join(workspaceRoot, 'node_modules/nano-staged/lib/bin.js')
const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

async function createHarness() {
  const directory = await mkdtemp(join(tmpdir(), 'markdown-studio-hook-'))
  temporaryDirectories.push(directory)

  const logPath = join(directory, 'commands.log')
  const stubPath = join(directory, 'stub.mjs')
  const configPath = join(directory, 'nano-staged.json')

  await writeFile(logPath, '')
  await writeFile(
    stubPath,
    `import { appendFile } from 'node:fs/promises'\n` +
      `const [command, ...args] = process.argv.slice(2)\n` +
      `await appendFile(process.env.FAKE_COMMAND_LOG, [command, ...args].join('\\n') + '\\n')\n`,
  )

  const packageJson = JSON.parse(await readFile(join(workspaceRoot, 'package.json'), 'utf8'))
  const stubCommand = (command) => {
    if (command === 'vp fmt') return `node ${stubPath} fmt`
    if (command === 'vp lint --fix') return `node ${stubPath} lint --fix`
    throw new Error(`Unexpected nano-staged command: ${command}`)
  }
  const config = Object.fromEntries(
    Object.entries(packageJson['nano-staged']).map(([pattern, commands]) => [
      pattern,
      Array.isArray(commands) ? commands.map(stubCommand) : stubCommand(commands),
    ]),
  )
  await writeFile(configPath, JSON.stringify(config, null, 2))

  execCommandSync('git', ['init', '-q'], { cwd: directory })
  execCommandSync('git', ['config', 'user.email', 'hook@example.com'], { cwd: directory })
  execCommandSync('git', ['config', 'user.name', 'Hook Test'], { cwd: directory })

  const runNanoStaged = () =>
    execCommandSync(process.execPath, [nanoStagedBin, '--config', configPath, '--quiet'], {
      cwd: directory,
      env: { ...process.env, FAKE_COMMAND_LOG: logPath },
    })

  return { directory, logPath, runNanoStaged }
}

function execCommandSync(command, args, options) {
  return execFileSync(command, args, { stdio: 'pipe', ...options })
}

function stageFiles(directory, paths) {
  execCommandSync('git', ['add', ...paths], { cwd: directory })
}

async function writeFixture(directory, path) {
  await mkdir(join(directory, path, '..'), { recursive: true })
  await writeFile(join(directory, path), 'content\n')
}

describe('nano-staged pre-commit config', () => {
  it('skips repository .agents files but formats and lints every other staged file', async () => {
    const { directory, logPath, runNanoStaged } = await createHarness()

    const paths = [
      '.agents/skills/example.md',
      '.agentsx/notes.md',
      'foo/.agentsx/notes.md',
      'apps/desktop/electron/asset-protocol.ts',
      'docs/example.md',
      'src.ts',
    ]

    for (const path of paths) {
      await writeFixture(directory, path)
    }

    stageFiles(directory, paths)
    runNanoStaged()

    const log = await readFile(logPath, 'utf8')

    expect(log).not.toContain('/.agents/skills/example.md')
    expect(log).toContain('/.agentsx/notes.md')
    expect(log).toContain('/foo/.agentsx/notes.md')
    expect(log).toContain('/apps/desktop/electron/asset-protocol.ts')
    expect(log).toContain('/docs/example.md')
    expect(log).toContain('/src.ts')
    expect(log).toMatch(/^fmt$/m)
    expect(log).toMatch(/^lint$/m)
  })

  it('exits cleanly when only .agents files are staged', async () => {
    const { directory, logPath, runNanoStaged } = await createHarness()
    const path = '.agents/skills/example.md'

    await writeFixture(directory, path)
    stageFiles(directory, [path])

    runNanoStaged()

    expect(await readFile(logPath, 'utf8')).toBe('')
  })
})
