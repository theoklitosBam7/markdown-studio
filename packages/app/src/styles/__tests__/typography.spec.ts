import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vite-plus/test'

const appRoot = path.resolve(process.cwd(), 'packages/app/src')
const globalCss = readFileSync(path.join(appRoot, 'styles/global.css'), 'utf8')

function vueFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry)
    if (statSync(fullPath).isDirectory()) return vueFiles(fullPath)
    return fullPath.endsWith('.vue') ? [fullPath] : []
  })
}

describe('app typography', () => {
  it('keeps the caption size token at 12px or larger', () => {
    const match = /--font-size-ui-caption:\s*(\d+(?:\.\d+)?)px/.exec(globalCss)

    expect(match?.[1]).toBeDefined()
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(12)
  })

  it('keeps component text at 12px or larger', () => {
    const violations: string[] = []

    for (const file of vueFiles(appRoot)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
        if (Number(match[1]) < 12) {
          violations.push(`${path.relative(appRoot, file)}: ${match[0]}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
