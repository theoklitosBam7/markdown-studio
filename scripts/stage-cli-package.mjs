import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const webDistDir = path.join(rootDir, 'apps/web/dist')
const cliPublicDir = path.join(rootDir, 'packages/cli/public')

await rm(cliPublicDir, { force: true, recursive: true })
await mkdir(path.dirname(cliPublicDir), { recursive: true })
await cp(webDistDir, cliPublicDir, { recursive: true })
