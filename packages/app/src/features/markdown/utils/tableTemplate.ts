export interface TableTemplateOptions {
  columns?: number
  rows?: number
}

/**
 * Generates GitHub Flavored Markdown table syntax with a header row,
 * separator row, and configurable body rows.
 */
export function generateTableTemplate(options: TableTemplateOptions = {}): string {
  const columns = Math.max(1, options.columns ?? 3)
  const rows = Math.max(1, options.rows ?? 3)
  const headerCells = Array.from({ length: columns }, (_, index) => `Header ${index + 1}`)
  const bodyRowCount = Math.max(0, rows - 1)
  const bodyRows = Array.from({ length: bodyRowCount }, () =>
    buildTableRow(Array.from({ length: columns }, () => '')),
  )

  return [buildTableRow(headerCells), buildSeparatorRow(columns), ...bodyRows].join('\n')
}

function buildSeparatorRow(columnCount: number): string {
  const separators = Array.from({ length: columnCount }, () => '---')
  return buildTableRow(separators)
}

function buildTableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`
}
