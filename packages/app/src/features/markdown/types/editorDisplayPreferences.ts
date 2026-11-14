export type EditorDisplayNumericPreference =
  | 'fontSizePx'
  | 'lineHeight'
  | 'tabWidth'
  | 'writingColumnCharacters'

export interface EditorDisplayPreferences {
  readonly fontSizePx: number
  readonly lineHeight: number
  readonly tabWidth: number
  readonly wordWrap: boolean
  readonly writingColumn: WritingColumnPreference
}

export type EditorDisplayPreferencesUpdate = Partial<EditorDisplayPreferences>
export type WritingColumnPreference =
  | { readonly characters: number; readonly kind: 'characters' }
  | { readonly kind: 'full-width' }

export const EDITOR_FONT_FLOOR_MEDIA_QUERY =
  '(max-width: 700px), (pointer: coarse), (max-width: 1000px) and (max-height: 500px)'

export const EDITOR_DISPLAY_PREFERENCE_LIMITS = {
  fontSizePx: { max: 32, min: 12, step: 0.5 },
  lineHeight: { max: 2.4, min: 1.2, step: 0.05 },
  tabWidth: { max: 8, min: 1, step: 1 },
  writingColumnCharacters: { max: 120, min: 40, step: 1 },
} as const

export function isValidEditorDisplayNumber(
  preference: EditorDisplayNumericPreference,
  value: unknown,
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false

  const { max, min, step } = EDITOR_DISPLAY_PREFERENCE_LIMITS[preference]
  if (value < min || value > max) return false

  const stepPosition = (value - min) / step
  return Math.abs(stepPosition - Math.round(stepPosition)) < 1e-8
}

export const DEFAULT_EDITOR_DISPLAY_PREFERENCES: EditorDisplayPreferences = {
  fontSizePx: 16,
  lineHeight: 1.7,
  tabWidth: 2,
  wordWrap: true,
  writingColumn: { characters: 80, kind: 'characters' },
}
