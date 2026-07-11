<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { EditorScrollPayload, ShortcutBinding } from '@/features/markdown/types'

import CommandPalette from '@/features/markdown/components/CommandPalette.vue'
import EditorPane from '@/features/markdown/components/EditorPane.vue'
import ExamplesModal from '@/features/markdown/components/ExamplesModal.vue'
import PreviewPane from '@/features/markdown/components/PreviewPane.vue'
import PwaBanner from '@/features/markdown/components/PwaBanner.vue'
import ShortcutsHelp from '@/features/markdown/components/ShortcutsHelp.vue'
import StatusBar from '@/features/markdown/components/StatusBar.vue'
import TableDimensionPicker from '@/features/markdown/components/TableDimensionPicker.vue'
import Toolbar from '@/features/markdown/components/Toolbar.vue'
import UpdateBanner from '@/features/markdown/components/UpdateBanner.vue'
import { useCommandPalette } from '@/features/markdown/composables/useCommandPalette'
import { useEditorWorkspaceCommands } from '@/features/markdown/composables/useEditorWorkspaceCommands'
import { useEditorWorkspaceController } from '@/features/markdown/composables/useEditorWorkspaceController'
import { useShortcuts } from '@/features/markdown/composables/useShortcuts'

const workspace = useEditorWorkspaceController()
const commands = useEditorWorkspaceCommands(workspace)
const commandPalette = useCommandPalette({ commands })
const isShortcutsHelpOpen = shallowRef(false)

const bindings = computed<ShortcutBinding[]>(() => [
  ...commands.value
    .filter((command) => command.shortcut)
    .map((command) => ({
      condition: () => command.disabledReason === null,
      group: command.group,
      handler: () => void command.run(),
      id: command.id,
      keys: command.shortcut!,
      label: command.title,
    })),
  {
    group: 'View',
    handler: commandPalette.open,
    id: 'shortcuts:palette' as const,
    keys: ['Mod', 'K'],
    label: 'Command Palette',
  },
  {
    group: 'View',
    handler: () => {
      isShortcutsHelpOpen.value = true
    },
    id: 'shortcuts:help' as const,
    keys: ['?'],
    label: 'Keyboard Shortcuts',
  },
  {
    aliases: [['F3']],
    condition: () => workspace.find.state.value.isOpen,
    group: 'Editor',
    handler: () => workspace.find.next(),
    id: 'shortcuts:find-next' as const,
    keys: ['Mod', 'G'],
    label: 'Find Next',
  },
  {
    aliases: [['Shift', 'F3']],
    condition: () => workspace.find.state.value.isOpen,
    group: 'Editor',
    handler: () => workspace.find.previous(),
    id: 'shortcuts:find-previous' as const,
    keys: ['Mod', 'Shift', 'G'],
    label: 'Find Previous',
  },
])

const isOverlayOpen = () =>
  isExamplesModalOpen.value ||
  isShortcutsHelpOpen.value ||
  commandPalette.isOpen.value ||
  workspace.state.isTableDimensionPickerOpen.value

const { shortcuts } = useShortcuts({
  bindings,
  isOverlayOpen,
})

const {
  availableModes,
  bannerStatus,
  bodyClasses,
  canExportPdf,
  canInstall,
  canOpenDocuments,
  canSaveDocuments,
  content,
  displayName,
  homebrewUpgradeCommand,
  isCopied,
  isDirty,
  isExamplesModalOpen,
  isHomebrewInstall,
  isMobile,
  pdfExportUnavailableReason,
  pwaBannerStatus,
  renderedHtml,
  showBanner,
  showPwaBanner,
  sourceMap,
  stats,
  statusText,
  theme,
  updateInfo,
  viewMode,
} = workspace.state
const editorPaneRef = useTemplateRef<InstanceType<typeof EditorPane>>('editorPane')
const previewPaneRef = useTemplateRef<InstanceType<typeof PreviewPane>>('previewPane')

watch(
  editorPaneRef,
  (editorPane) => {
    if (!editorPane) {
      workspace.attach.editor(null)
      return
    }

    workspace.attach.editor({
      focus: () => editorPane.focus(),
      focusAtOffset: (offset) => editorPane.focusAtOffset(offset),
      focusFindQuery: () => editorPane.focusFindQuery(),
      getScrollState: () => editorPane.getScrollState(),
      insertText: (text) => editorPane.insertText(text),
      replaceAllContent: (content) => editorPane.replaceAllContent(content),
      replaceRange: (start, end, replacement) => editorPane.replaceRange(start, end, replacement),
      setSelectionRange: (start, end) => editorPane.setSelectionRange(start, end),
    })
  },
  { immediate: true },
)

watch(
  previewPaneRef,
  (previewPane) => {
    if (!previewPane) {
      workspace.attach.preview(null)
      return
    }

    workspace.attach.preview({
      scrollToSourceOffset: (offset) => previewPane.scrollToSourceOffset(offset),
    })
  },
  { immediate: true },
)

function closeShortcutsHelp(): void {
  isShortcutsHelpOpen.value = false
}

function handleEditorScroll(scrollState: EditorScrollPayload): void {
  workspace.editor.syncPreviewToEditorPosition(scrollState)
}

function handleExportHtml(): void {
  void workspace.export.html().catch((error: unknown) => {
    console.error('Failed to export HTML:', error)
  })
}

function handleExportPdf(): void {
  void workspace.export.pdf().catch((error: unknown) => {
    console.error('Failed to export PDF:', error)
  })
}

function handleFindAction(action: { type: string; value?: unknown }): void {
  switch (action.type) {
    case 'close':
      workspace.find.close()
      return
    case 'next':
      workspace.find.next()
      return
    case 'open':
      workspace.find.open()
      return
    case 'open-replace':
      workspace.find.openReplace()
      return
    case 'previous':
      workspace.find.previous()
      return
    case 'replace-all':
      void workspace.find.replaceAll()
      return
    case 'replace-current':
      void workspace.find.replaceCurrent()
      return
    case 'set-match-case':
      workspace.find.setMatchCase(action.value as boolean)
      return
    case 'set-query':
      workspace.find.setQuery(action.value as string)
      return
    case 'set-replace-text':
      workspace.find.setReplaceText(action.value as string)
      return
  }
}

function handleInsertTable(): void {
  void workspace.editor.insertTable().catch((error: unknown) => {
    console.error('Failed to insert table:', error)
  })
}

function handleInstall(): void {
  void workspace.toolbar.install().catch((error: unknown) => {
    console.error('Failed to trigger web app install:', error)
  })
}

function handleReplaceSourceRange(start: number, end: number, replacement: string): void {
  void editorPaneRef.value?.replaceRange(start, end, replacement)
}

function handleStartNewDocument(): void {
  void workspace.document.startNew().catch((error: unknown) => {
    console.error('Failed to start new document:', error)
  })
}

function handleTableDimensionsUpdate(dimensions: { columns: number; rows: number }): void {
  workspace.editor.setTableDimensions(dimensions)
}

function handleTableInsertionCancel(): void {
  workspace.editor.cancelTableInsertion()
}

function handleTableInsertionConfirm(): void {
  void workspace.editor.confirmTableInsertion().catch((error: unknown) => {
    console.error('Failed to confirm table insertion:', error)
  })
}
</script>

<template>
  <div class="markdown-studio" :class="bodyClasses">
    <Toolbar
      :available-modes="availableModes"
      :can-export-pdf="canExportPdf"
      :can-open-documents="canOpenDocuments"
      :can-install="canInstall"
      :can-save-documents="canSaveDocuments"
      :is-mobile="isMobile"
      :view-mode="viewMode"
      :pdf-export-unavailable-reason="pdfExportUnavailableReason"
      :theme="theme"
      :is-copied="isCopied"
      @install="handleInstall"
      @open-document="workspace.document.open"
      @update:view-mode="workspace.editor.setViewMode"
      @update:theme="workspace.editor.setTheme"
      @open-examples="workspace.examples.open"
      @open-shortcuts="isShortcutsHelpOpen = true"
      @clear="handleStartNewDocument"
      @copy="workspace.toolbar.copy"
      @insert-table="handleInsertTable"
      @export-html="handleExportHtml"
      @export-pdf="handleExportPdf"
      @save-document="workspace.document.save"
    />

    <Transition name="banner-slide">
      <UpdateBanner
        v-if="showBanner"
        :status="bannerStatus"
        :current-version="updateInfo?.currentVersion"
        :latest-version="updateInfo?.latestVersion"
        :is-homebrew-install="isHomebrewInstall"
        :homebrew-upgrade-command="homebrewUpgradeCommand"
        @dismiss="workspace.toolbar.dismissUpdateBanner"
        @download="workspace.toolbar.downloadUpdate"
      />
    </Transition>

    <Transition name="banner-slide">
      <PwaBanner
        v-if="showPwaBanner"
        :status="pwaBannerStatus"
        @dismiss="workspace.toolbar.dismissPwaBanner"
        @refresh="workspace.toolbar.updateApp"
      />
    </Transition>

    <main class="main-content">
      <!-- workspace.find.state is a ComputedRef, so we pass its current snapshot via .value -->
      <EditorPane
        ref="editorPane"
        :content="content"
        :find-state="workspace.find.state.value"
        :line-count="stats.lines"
        @find-action="handleFindAction"
        @scroll="handleEditorScroll"
        @update:content="workspace.editor.updateContent"
      />
      <PreviewPane
        ref="previewPane"
        :html="renderedHtml"
        :source-map="sourceMap"
        :theme="theme"
        :word-count="stats.words"
        @jump-to-offset="workspace.preview.jumpToOffset"
        @render-diagrams="workspace.preview.renderDiagrams"
        @replace-source-range="handleReplaceSourceRange"
      />
    </main>

    <StatusBar
      :chars="stats.chars"
      :diagrams="stats.diagrams"
      :document-name="displayName"
      :is-dirty="isDirty"
      :status="statusText"
    />

    <ExamplesModal
      :is-open="isExamplesModalOpen"
      @close="workspace.examples.close"
      @select="workspace.document.loadExample"
    />

    <CommandPalette
      :active-command-id="commandPalette.activeCommandId.value"
      :is-open="commandPalette.isOpen.value"
      :query="commandPalette.query.value"
      :results="commandPalette.results.value"
      @close="commandPalette.close"
      @execute="commandPalette.execute"
      @move-active="commandPalette.moveActive"
      @update:query="commandPalette.setQuery"
    />

    <ShortcutsHelp
      :is-open="isShortcutsHelpOpen"
      :shortcuts="shortcuts"
      @close="closeShortcutsHelp"
    />

    <TableDimensionPicker
      :columns="workspace.state.tableDimensions.value.columns"
      :is-open="workspace.state.isTableDimensionPickerOpen.value"
      :rows="workspace.state.tableDimensions.value.rows"
      @cancel="handleTableInsertionCancel"
      @confirm="handleTableInsertionConfirm"
      @update:columns="
        (columns) =>
          handleTableDimensionsUpdate({
            columns,
            rows: workspace.state.tableDimensions.value.rows,
          })
      "
      @update:rows="
        (rows) =>
          handleTableDimensionsUpdate({
            columns: workspace.state.tableDimensions.value.columns,
            rows,
          })
      "
    />
  </div>
</template>

<style scoped>
.markdown-studio {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* View mode styles */
.markdown-studio.view-editor :deep(.preview-pane) {
  display: none;
}

.markdown-studio.view-editor :deep(.editor-pane) {
  border-right: none;
}

.markdown-studio.view-preview :deep(.editor-pane) {
  display: none;
}

.markdown-studio.view-preview :deep(.preview-pane) {
  border-right: none;
}

@media (max-width: 700px) {
  .main-content {
    flex-direction: column;
  }

  .markdown-studio :deep(.editor-pane),
  .markdown-studio :deep(.preview-pane) {
    min-height: 0;
  }
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease,
    padding-top 0.3s ease,
    padding-bottom 0.3s ease;
  overflow: hidden;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.banner-slide-enter-to,
.banner-slide-leave-from {
  max-height: 60px;
  opacity: 1;
}
</style>
