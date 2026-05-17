import type { AppCommand } from '@markdown-studio/desktop-contract/types'

export type CommandGroup = 'Document' | 'Editor' | 'Examples' | 'View'

export interface CommandPaletteResult {
  command: EditorWorkspaceCommand
  score: number
}

export interface EditorWorkspaceCommand {
  disabledReason: null | string
  group: CommandGroup
  id: `workspace:${string}` | AppCommand
  isCurrent?: boolean
  keywords?: string[]
  run(): Promise<void> | void
  shortcut?: string[]
  title: string
}
