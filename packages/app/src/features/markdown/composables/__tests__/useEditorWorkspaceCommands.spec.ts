import type { ActiveDocumentKind } from '@/types/document'
import type { Theme, ViewMode } from '@/types/editor'
import type { EditorWorkspaceController } from '../../types/workspace'

import { describe, expect, it, vi } from 'vite-plus/test'
import { shallowRef } from 'vue'

import { useEditorWorkspaceCommands } from '../useEditorWorkspaceCommands'

describe('useEditorWorkspaceCommands', () => {
  it('hides Markdown editing commands while an HTML Document is active', () => {
    const commands = createCommands('html')

    expect(commands).toContain('document:open')
    expect(commands).toContain('workspace:document:new')
    expect(commands).not.toContain('document:save')
    expect(commands).not.toContain('document:exportHtml')
    expect(commands).not.toContain('editor:find')
    expect(commands).not.toContain('workspace:editor:insertTable')
  })

  it('keeps Markdown editing commands for a Markdown Document', () => {
    const commands = createCommands('markdown')

    expect(commands).toContain('document:save')
    expect(commands).toContain('document:exportHtml')
    expect(commands).toContain('editor:find')
    expect(commands).toContain('workspace:editor:insertTable')
  })
})

function createCommands(documentKind: ActiveDocumentKind): string[] {
  const noop = vi.fn()
  const availableModes: ViewMode[] =
    documentKind === 'html' ? ['preview'] : ['editor', 'split', 'preview']
  const workspace = {
    document: { open: noop, save: noop, saveAs: noop, startNew: noop },
    editor: { insertTable: noop, setTheme: noop, setViewMode: noop },
    examples: { open: noop },
    export: { html: noop, pdf: noop },
    find: { open: noop, openReplace: noop },
    folders: { add: noop, changeTab: noop, refresh: noop },
    state: {
      availableModes: shallowRef(availableModes),
      canExportPdf: shallowRef(true),
      canOpenDocuments: shallowRef(true),
      canSaveDocuments: shallowRef(true),
      documentKind: shallowRef(documentKind),
      isFolderBrowserAvailable: shallowRef(true),
      pdfExportUnavailableReason: shallowRef(''),
      theme: shallowRef<Theme>('light'),
      viewMode: shallowRef<ViewMode>('preview'),
    },
  } as unknown as EditorWorkspaceController

  return useEditorWorkspaceCommands(workspace, { openEditorDisplay: noop }).value.map(
    (command) => command.id,
  )
}
