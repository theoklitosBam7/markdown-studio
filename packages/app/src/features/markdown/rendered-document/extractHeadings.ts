import type { MarkdownOutlineHeading, MarkdownSourceMapEntry } from '../types'

export function extractHeadings(sourceMap: MarkdownSourceMapEntry[]): MarkdownOutlineHeading[] {
  return sourceMap.flatMap((entry) => {
    if (entry.type !== 'heading' || entry.depth === undefined || entry.text === undefined) {
      return []
    }

    return [
      {
        depth: entry.depth,
        id: entry.id,
        start: entry.start,
        text: entry.text,
      },
    ]
  })
}
