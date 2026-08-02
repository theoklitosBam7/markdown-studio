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

export interface FindMatch {
  end: number
  index: number
  length: number
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
