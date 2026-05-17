import { computed, type ComputedRef } from 'vue'

import type { EditorWorkspaceCommand } from '../types/commands'
import type { EditorWorkspaceController } from '../types/workspace'

export function useEditorWorkspaceCommands(
  workspace: EditorWorkspaceController,
): ComputedRef<EditorWorkspaceCommand[]> {
  return computed(() => {
    const state = workspace.state
    const canOpenDocuments = state.canOpenDocuments.value
    const canSaveDocuments = state.canSaveDocuments.value
    const canExportPdf = state.canExportPdf.value
    const pdfExportUnavailableReason = state.pdfExportUnavailableReason.value
    const availableModes = state.availableModes.value
    const viewMode = state.viewMode.value
    const theme = state.theme.value

    const commands: EditorWorkspaceCommand[] = [
      {
        disabledReason: null,
        group: 'Document',
        id: 'workspace:document:new',
        keywords: ['clear', 'blank', 'new file'],
        run: workspace.document.startNew,
        title: 'New Markdown Document',
      },
      {
        disabledReason: canOpenDocuments ? null : 'Open is available in the desktop app.',
        group: 'Document',
        id: 'document:open',
        keywords: ['file', 'load'],
        run: workspace.document.open,
        shortcut: ['Mod', 'O'],
        title: 'Open Document...',
      },
      {
        disabledReason: canSaveDocuments ? null : 'Save is available in the desktop app.',
        group: 'Document',
        id: 'document:save',
        keywords: ['write', 'file'],
        run: workspace.document.save,
        shortcut: ['Mod', 'S'],
        title: 'Save Document',
      },
      {
        disabledReason: canSaveDocuments ? null : 'Save As is available in the desktop app.',
        group: 'Document',
        id: 'document:saveAs',
        keywords: ['rename', 'copy', 'file'],
        run: workspace.document.saveAs,
        shortcut: ['Mod', 'Shift', 'S'],
        title: 'Save Document As...',
      },
      {
        disabledReason: null,
        group: 'Document',
        id: 'document:exportHtml',
        keywords: ['download', 'html'],
        run: workspace.export.html,
        title: 'Export HTML...',
      },
      {
        disabledReason: canExportPdf
          ? null
          : pdfExportUnavailableReason || 'PDF export is unavailable.',
        group: 'Document',
        id: 'document:exportPdf',
        keywords: ['download', 'pdf', 'print'],
        run: workspace.export.pdf,
        title: 'Export PDF...',
      },
      {
        disabledReason: null,
        group: 'Editor',
        id: 'editor:find',
        keywords: ['search'],
        run: workspace.find.open,
        shortcut: ['Mod', 'F'],
        title: 'Find',
      },
      {
        disabledReason: null,
        group: 'Editor',
        id: 'editor:replace',
        keywords: ['search', 'substitute'],
        run: workspace.find.openReplace,
        shortcut: ['Mod', 'H'],
        title: 'Replace',
      },
      {
        disabledReason: null,
        group: 'View',
        id: 'workspace:view:editor',
        isCurrent: viewMode === 'editor',
        keywords: ['markdown', 'write'],
        run: () => workspace.editor.setViewMode('editor'),
        title: 'Show Editor',
      },
      {
        disabledReason: null,
        group: 'View',
        id: 'workspace:view:split',
        isCurrent: viewMode === 'split',
        keywords: ['preview', 'split', 'side by side'],
        run: () => workspace.editor.setViewMode('split'),
        title: 'Show Editor and Live Preview',
      },
      {
        disabledReason: null,
        group: 'View',
        id: 'workspace:view:preview',
        isCurrent: viewMode === 'preview',
        keywords: ['rendered', 'preview'],
        run: () => workspace.editor.setViewMode('preview'),
        title: 'Show Live Preview',
      },
      {
        disabledReason: null,
        group: 'View',
        id: 'workspace:theme:light',
        isCurrent: theme === 'light',
        keywords: ['light mode'],
        run: () => workspace.editor.setTheme({ origin: getViewportCenter(), theme: 'light' }),
        title: 'Use Light Theme',
      },
      {
        disabledReason: null,
        group: 'View',
        id: 'workspace:theme:dark',
        isCurrent: theme === 'dark',
        keywords: ['dark mode'],
        run: () => workspace.editor.setTheme({ origin: getViewportCenter(), theme: 'dark' }),
        title: 'Use Dark Theme',
      },
      {
        disabledReason: null,
        group: 'Examples',
        id: 'workspace:examples:open',
        keywords: ['samples', 'templates'],
        run: workspace.examples.open,
        title: 'Open Example Documents...',
      },
    ]

    return commands.filter((command) => {
      if (command.id === 'workspace:view:editor') return availableModes.includes('editor')
      if (command.id === 'workspace:view:split') return availableModes.includes('split')
      if (command.id === 'workspace:view:preview') return availableModes.includes('preview')

      return true
    })
  })
}

function getViewportCenter(): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
}
