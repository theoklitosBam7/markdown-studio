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

export interface MarkdownOutlineHeading {
  depth: number
  id: string
  start: number
  text: string
}

export interface MarkdownSourceMapEntry {
  checkboxEnd?: number
  checkboxStart?: number
  depth?: number
  end: number
  id: string
  start: number
  text?: string
  type: string
}

export type Theme = 'dark' | 'light'
export type ViewMode = 'editor' | 'preview' | 'split'
