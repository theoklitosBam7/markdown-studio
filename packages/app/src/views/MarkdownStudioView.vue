<script setup lang="ts">
import type { AppCommand } from '@markdown-studio/desktop-contract/types'

import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import type { Example, Theme, ViewMode } from '@/features/markdown/types'

import { useDesktop } from '@/composables/useDesktop'
import { useThemeTransition } from '@/composables/useThemeTransition'
import EditorPane from '@/features/markdown/components/EditorPane.vue'
import ExamplesModal from '@/features/markdown/components/ExamplesModal.vue'
import PreviewPane from '@/features/markdown/components/PreviewPane.vue'
import StatusBar from '@/features/markdown/components/StatusBar.vue'
import Toolbar from '@/features/markdown/components/Toolbar.vue'
import { useDocumentSession } from '@/features/markdown/composables/useDocumentSession'
import { useMarkdownEditor } from '@/features/markdown/composables/useMarkdownEditor'

// Use the composable
const {
  content,
  copyContent,
  isCopied,
  loadExample,
  renderedHtml,
  renderMermaidDiagrams,
  setTheme,
  setViewMode,
  sourceMap,
  stats,
  theme,
  updateContent,
  viewMode,
} = useMarkdownEditor()
const desktop = useDesktop()
const {
  canOpenDocuments,
  canSaveDocuments,
  displayName,
  handleAppCommand,
  isDirty,
  openDocument,
  saveDocument,
  startNewDocument,
  statusText,
} = useDocumentSession({
  content,
  replaceContent: updateContent,
})

interface EditorScrollPayload {
  clientHeight: number
  contentLength: number
  lineHeight: number
  scrollHeight: number
  scrollTop: number
}

interface ThemeChangeRequest {
  origin: { x: number; y: number }
  theme: Theme
}

const { transitionTheme } = useThemeTransition()
const mobileBreakpoint = 700

// Local state
const isExamplesModalOpen = shallowRef(false)
const isMobile = shallowRef(false)
let removeDesktopCommandListener: () => void = () => undefined
const editorPaneRef = useTemplateRef<InstanceType<typeof EditorPane>>('editorPane')
const previewPaneRef = useTemplateRef<InstanceType<typeof PreviewPane>>('previewPane')
const availableModes = computed<ViewMode[]>(() =>
  isMobile.value ? ['editor', 'preview'] : ['editor', 'split', 'preview'],
)

// Computed body classes for view mode and theme
const bodyClasses = computed(() => ({
  'is-mobile': isMobile.value,
  'view-editor': viewMode.value === 'editor',
  'view-preview': viewMode.value === 'preview',
  'view-split': viewMode.value === 'split',
}))

// Watch theme and apply to document
watch(
  theme,
  (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  },
  { immediate: true },
)

function closeExamples(): void {
  isExamplesModalOpen.value = false
}

function getOffsetForLine(contentValue: string, lineNumber: number): number {
  if (lineNumber <= 0) return 0

  let currentLine = 0

  for (let index = 0; index < contentValue.length; index += 1) {
    if (contentValue[index] === '\n') {
      currentLine += 1
      if (currentLine === lineNumber) {
        return index + 1
      }
    }
  }

  return contentValue.length
}

function handleClear(): void {
  void startNewDocument().catch((error: unknown) => {
    console.error('Failed to start new document:', error)
  })
}

function handleContentUpdate(value: string): void {
  updateContent(value)
}

function handleEditorScroll(scrollState: EditorScrollPayload): void {
  syncPreviewToEditorPosition(scrollState)
}

function handleExampleSelect(example: Example): void {
  loadExample(example)
  // Focus the editor after loading
  setTimeout(() => {
    editorPaneRef.value?.focus()
  }, 0)
}

function handlePreviewJump(offset: number): void {
  if (isMobile.value || viewMode.value !== 'split') return

  void editorPaneRef.value?.focusAtOffset(offset)
}

function handleRenderDiagrams(container: HTMLElement): void {
  renderMermaidDiagrams(container)
}

async function handleThemeChange(request: ThemeChangeRequest): Promise<void> {
  if (request.theme === theme.value) return

  await transitionTheme(request.theme, setTheme, {
    origin: request.origin,
  })
}

// Actions
function handleViewModeChange(mode: ViewMode): void {
  setViewMode(mode)
}

function openExamples(): void {
  isExamplesModalOpen.value = true
}

function syncPreviewToEditorPosition(scrollState?: EditorScrollPayload | null): void {
  if (isMobile.value || viewMode.value !== 'split') return

  const effectiveScrollState = scrollState ?? editorPaneRef.value?.getScrollState()
  if (!effectiveScrollState) return

  const topLine = Math.max(
    0,
    Math.floor(effectiveScrollState.scrollTop / effectiveScrollState.lineHeight),
  )
  const sourceOffset = getOffsetForLine(content.value, topLine)
  previewPaneRef.value?.scrollToSourceOffset(sourceOffset)
}

function syncViewport(): void {
  if (typeof window === 'undefined') return

  const nextIsMobile = window.innerWidth <= mobileBreakpoint
  isMobile.value = nextIsMobile

  if (nextIsMobile && viewMode.value === 'split') {
    setViewMode('editor')
  }
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)

  const onAppCommand = desktop.value?.commands?.onAppCommand
  if (onAppCommand) {
    removeDesktopCommandListener = onAppCommand((command: AppCommand) => {
      void handleAppCommand(command).catch((err: unknown) => {
        console.error('Failed to handle desktop app command:', err)
      })
    })
  } else {
    removeDesktopCommandListener = () => undefined
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)
  removeDesktopCommandListener()
})

watch(
  () => [content.value, isMobile.value, sourceMap.value, viewMode.value],
  async () => {
    await nextTick()
    syncPreviewToEditorPosition()
  },
  { deep: true },
)
</script>

<template>
  <div class="markdown-studio" :class="bodyClasses">
    <Toolbar
      :available-modes="availableModes"
      :can-open-documents="canOpenDocuments"
      :can-save-documents="canSaveDocuments"
      :is-mobile="isMobile"
      :view-mode="viewMode"
      :theme="theme"
      :is-copied="isCopied"
      @open-document="openDocument"
      @update:view-mode="handleViewModeChange"
      @update:theme="handleThemeChange"
      @open-examples="openExamples"
      @clear="handleClear"
      @copy="copyContent"
      @save-document="saveDocument"
    />

    <main class="main-content">
      <EditorPane
        ref="editorPane"
        :content="content"
        :line-count="stats.lines"
        @scroll="handleEditorScroll"
        @update:content="handleContentUpdate"
      />
      <PreviewPane
        ref="previewPane"
        :html="renderedHtml"
        :source-map="sourceMap"
        :theme="theme"
        :word-count="stats.words"
        @jump-to-offset="handlePreviewJump"
        @render-diagrams="handleRenderDiagrams"
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
      @close="closeExamples"
      @select="handleExampleSelect"
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
</style>
