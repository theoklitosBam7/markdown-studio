<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'

import type { EditorScrollPayload } from '@/features/markdown/types'

import EditorPane from '@/features/markdown/components/EditorPane.vue'
import ExamplesModal from '@/features/markdown/components/ExamplesModal.vue'
import PreviewPane from '@/features/markdown/components/PreviewPane.vue'
import PwaBanner from '@/features/markdown/components/PwaBanner.vue'
import StatusBar from '@/features/markdown/components/StatusBar.vue'
import Toolbar from '@/features/markdown/components/Toolbar.vue'
import UpdateBanner from '@/features/markdown/components/UpdateBanner.vue'
import { useEditorWorkspaceController } from '@/features/markdown/composables/useEditorWorkspaceController'

const workspace = useEditorWorkspaceController()
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
  isCopied,
  isDirty,
  isExamplesModalOpen,
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

function handleInstall(): void {
  void workspace.toolbar.install().catch((error: unknown) => {
    console.error('Failed to trigger web app install:', error)
  })
}

function handleStartNewDocument(): void {
  void workspace.document.startNew().catch((error: unknown) => {
    console.error('Failed to start new document:', error)
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
      @clear="handleStartNewDocument"
      @copy="workspace.toolbar.copy"
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
        @find-action="workspace.find.dispatch"
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
