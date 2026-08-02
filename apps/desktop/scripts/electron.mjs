import electronPath from 'electron'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { build, createServer, mergeConfig } from 'vite'

import { mainConfig, preloadConfig, rendererConfig } from '../electron.vite.config.ts'

const desktopRoot = fileURLToPath(new URL('../', import.meta.url))
const mainEntry = fileURLToPath(new URL('../out/main/main.js', import.meta.url))
const [, , command = 'dev', ...arguments_] = process.argv

const electronOptions = parseArguments(arguments_)

if (command === 'build') {
  await buildDesktop()
} else if (command === 'preview') {
  await previewDesktop()
} else if (command === 'dev' || command === 'serve') {
  await developDesktop()
} else {
  throw new Error(`Unknown desktop command: ${command}`)
}

async function buildDesktop() {
  await build(mainConfig)
  await build(preloadConfig)
  await build(rendererConfig)
}

async function developDesktop() {
  let rendererServer
  let electronProcess
  let isShuttingDown = false
  let resolveElectronExit
  const electronExit = new Promise((resolve) => {
    resolveElectronExit = resolve
  })
  const watchers = []

  const shutdown = async (exitCode) => {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true
    const currentElectronProcess = electronProcess
    electronProcess = undefined

    await Promise.all(watchers.map((watcher) => watcher.close()))
    await rendererServer?.close()
    if (currentElectronProcess) {
      await stopProcess(currentElectronProcess)
    }
    process.exitCode = exitCode
  }

  const launchElectron = () => {
    const child = spawnElectron()
    electronProcess = child
    child.once('error', (error) => {
      console.error('Failed to start Electron:', error)
    })
    child.once('exit', (code, signal) => {
      if (child !== electronProcess || isShuttingDown) {
        return
      }

      resolveElectronExit(code ?? (signal ? 1 : 0))
    })
  }

  const restartElectron = async () => {
    const previousProcess = electronProcess
    electronProcess = undefined

    if (previousProcess) {
      await stopProcess(previousProcess)
    }

    if (!isShuttingDown) {
      launchElectron()
    }
  }

  const reloadRenderer = () => {
    rendererServer?.ws.send({ type: 'full-reload' })
  }

  const handleSignal = () => {
    void shutdown(0).then(() => resolveElectronExit(0))
  }

  process.once('SIGINT', handleSignal)
  process.once('SIGTERM', handleSignal)

  try {
    if (electronOptions.watch) {
      watchers.push(await watchElectronTarget(mainConfig, restartElectron))
      watchers.push(await watchElectronTarget(preloadConfig, reloadRenderer))
    } else {
      await build(mainConfig)
      await build(preloadConfig)
    }

    process.env.NODE_ENV = 'development'
    rendererServer = await createServer(rendererConfig)
    await rendererServer.listen()
    process.env.ELECTRON_RENDERER_URL = getRendererUrl(rendererServer)
    rendererServer.printUrls()

    launchElectron()
    const exitCode = await electronExit
    await shutdown(exitCode)
  } finally {
    process.removeListener('SIGINT', handleSignal)
    process.removeListener('SIGTERM', handleSignal)
    await shutdown(process.exitCode ?? 1)
  }
}

function getRendererUrl(server) {
  const localUrl = server.resolvedUrls?.local[0]

  if (localUrl) {
    return localUrl
  }

  const protocol = server.config.server.https ? 'https' : 'http'
  const host =
    server.config.server.host === true ? 'localhost' : (server.config.server.host ?? 'localhost')
  return `${protocol}://${host}:${server.config.server.port}`
}

function parseArguments(arguments_) {
  const electronArguments = []
  let watch = false
  let skipBuild = false

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]

    if (argument === '--watch') {
      watch = true
    } else if (argument === '--skipBuild') {
      skipBuild = true
    } else if (argument === '--noSandbox') {
      electronArguments.push('--no-sandbox')
    } else if (argument === '--inspect' || argument === '--inspectBrk') {
      const inspectorFlag = argument === '--inspect' ? '--inspect' : '--inspect-brk'
      const nextArgument = arguments_[index + 1]
      const port = nextArgument && /^\d+$/.test(nextArgument) ? arguments_[++index] : '5858'
      electronArguments.push(`${inspectorFlag}=${port}`)
    } else if (argument === '--remoteDebuggingPort') {
      const port = arguments_[++index]
      if (port) {
        electronArguments.push(`--remote-debugging-port=${port}`)
      }
    } else if (argument === '--') {
      electronArguments.push(...arguments_.slice(index + 1))
      break
    } else {
      electronArguments.push(argument)
    }
  }

  return { electronArguments, skipBuild, watch }
}

async function previewDesktop() {
  if (!electronOptions.skipBuild) {
    await buildDesktop()
  }

  const exitCode = await runElectron({ clearRendererUrl: true })
  process.exitCode = exitCode
}

async function runElectron(options) {
  const child = spawnElectron(options)
  child.once('error', (error) => {
    console.error('Failed to start Electron:', error)
  })
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)))
  })
}

function spawnElectron({ clearRendererUrl = false } = {}) {
  const environment = { ...process.env }

  if (clearRendererUrl) {
    delete environment.ELECTRON_RENDERER_URL
  }

  return spawn(electronPath, [mainEntry, ...electronOptions.electronArguments], {
    cwd: desktopRoot,
    env: environment,
    stdio: 'inherit',
  })
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }

  await new Promise((resolve) => {
    child.once('exit', resolve)
    child.kill()
  })
}

async function watchElectronTarget(config, onRebuild) {
  let isFirstBuild = true
  let resolveFirstBuild
  let rejectFirstBuild
  const firstBuild = new Promise((resolve, reject) => {
    resolveFirstBuild = resolve
    rejectFirstBuild = reject
  })

  const watchConfig = mergeConfig(config, {
    build: {
      watch: {},
    },
    plugins: [
      {
        closeBundle() {
          if (isFirstBuild) {
            isFirstBuild = false
            resolveFirstBuild()
            return
          }

          void onRebuild()
        },
        name: 'markdown-studio-electron-watch',
      },
    ],
  })

  const watcherPromise = build(watchConfig).catch((error) => {
    rejectFirstBuild(error)
    throw error
  })

  await firstBuild
  return watcherPromise
}
