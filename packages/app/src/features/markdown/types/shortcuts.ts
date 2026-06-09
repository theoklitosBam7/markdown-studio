import type { CommandGroup, EditorWorkspaceCommand } from './commands'

/** Display-only subset used by the ShortcutsHelp overlay. */
export interface Shortcut {
  group: CommandGroup
  id: ShortcutId
  keys: string[]
  label: string
}

/**
 * Canonical binding: keys → action.
 *
 * Built once at the call site and consumed by the keyboard composable for both
 * dispatch and the shortcuts help overlay.
 */
export interface ShortcutBinding {
  /** Additional key combos that map to the same action */
  aliases?: string[][]
  /** When true the binding fires even while an overlay is open. */
  allowThroughOverlay?: boolean
  /** Optional runtime condition — the binding only fires when this returns true. */
  condition?: () => boolean
  group: CommandGroup
  handler: () => void
  id: ShortcutId
  keys: string[]
  label: string
}

export type ShortcutId = `shortcuts:${string}` | EditorWorkspaceCommand['id']
