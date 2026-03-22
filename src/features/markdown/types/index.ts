export interface EditorStats {
  chars: number
  diagrams: number
  lines: number
  words: number
}

export interface Example {
  content: string
  desc: string
  title: string
}

export type Theme = 'dark' | 'light'
export type ViewMode = 'editor' | 'preview' | 'split'
