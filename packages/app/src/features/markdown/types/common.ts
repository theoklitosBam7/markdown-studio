export interface EditorStats {
  chars: number
  diagrams: number
  lines: number
  words: number
}

export interface Example {
  content: string
  desc: string
  id: string
  title: string
}

export interface MarkdownSourceMapEntry {
  end: number
  id: string
  start: number
  type: string
}

export type Theme = 'dark' | 'light'
export type ViewMode = 'editor' | 'preview' | 'split'
