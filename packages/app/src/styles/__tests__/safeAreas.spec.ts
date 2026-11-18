import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vite-plus/test'

const appRoot = path.resolve(process.cwd(), 'packages/app/src')

function vueFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry)
    if (statSync(fullPath).isDirectory()) return vueFiles(fullPath)
    return fullPath.endsWith('.vue') ? [fullPath] : []
  })
}

describe('safe area usage', () => {
  it('keeps a plain fallback before every safe-area inset declaration', () => {
    const violations: string[] = []

    for (const file of vueFiles(appRoot)) {
      const lines = readFileSync(file, 'utf8').split('\n')

      lines.forEach((line, index) => {
        if (!line.includes('env(safe-area-inset-')) return

        const property = /^\s*([a-z-]+)\s*:/.exec(line)?.[1]
        if (!property) return

        const previous = lines
          .slice(0, index)
          .reverse()
          .find((candidate) => {
            const trimmed = candidate.trim()
            return trimmed.length > 0 && !trimmed.startsWith('/*') && !trimmed.startsWith('*')
          })
          ?.trim()

        const hasFallback =
          previous?.startsWith(`${property}:`) === true && !previous.includes('env(')
        if (!hasFallback) {
          violations.push(`${path.relative(appRoot, file)}:${index + 1} (${property})`)
        }
      })
    }

    expect(violations).toEqual([])
  })
})
