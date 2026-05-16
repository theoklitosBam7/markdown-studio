export { DEFAULT_EXAMPLE_INDEX, EXAMPLES } from './composables/examples'
export { useDocumentExport } from './composables/useDocumentExport'
// Composables
export { useEditorWorkspaceController } from './composables/useEditorWorkspaceController'
export { useMarkdownEditor } from './composables/useMarkdownEditor'
export { renderMarkdownWithSourceMap } from './rendered-document'

export {
  buildExportHtml,
  getDefaultTitle,
  getSuggestedFileName,
  renderExport,
  renderPreview,
} from './rendered-document'

// Types
export type {
  EditorPaneAdapter,
  EditorScrollPayload,
  EditorStats,
  EditorWorkspaceController,
  EditorWorkspaceFindApi,
  EditorWorkspaceState,
  Example,
  MarkdownSourceMapEntry,
  PreviewPaneAdapter,
  Theme,
  ThemeChangeRequest,
  ViewMode,
} from './types'

export { buildMarkdownDocumentHtml, renderMarkdownDocument } from './utils/renderMarkdownDocument'
