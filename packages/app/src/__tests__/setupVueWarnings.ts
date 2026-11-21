import { afterAll, afterEach, beforeEach } from 'vite-plus/test'

import { captureVueWarning, takeVueWarnings } from './testEnvironment'

type WarningGuard = (...args: Parameters<typeof console.warn>) => void

interface WarningGuardState {
  guard: WarningGuard
}

const globalScope = globalThis as {
  markdownStudioVueWarningGuard?: WarningGuardState
} & typeof globalThis

function createWarningGuard(): WarningGuardState {
  const originalWarn = console.warn

  return {
    guard: (...args) => {
      captureVueWarning(...args)
      originalWarn(...args)
    },
  }
}

function failOnVueWarnings(): void {
  const warnings = takeVueWarnings()
  if (warnings.length === 0) return

  throw new Error(`Vue warnings must be fixed, not ignored:\n${warnings.join('\n')}`)
}

const warningGuard = globalScope.markdownStudioVueWarningGuard ?? createWarningGuard()
globalScope.markdownStudioVueWarningGuard = warningGuard
console.warn = warningGuard.guard

beforeEach(() => {
  console.warn = warningGuard.guard
})

afterEach(failOnVueWarnings)
afterAll(failOnVueWarnings)
