<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import type { Example, Theme, ViewMode } from '@/features/markdown/types'

import { useThemeTransition } from '@/composables/useThemeTransition'
import EditorPane from '@/features/markdown/components/EditorPane.vue'
import ExamplesModal from '@/features/markdown/components/ExamplesModal.vue'
import PreviewPane from '@/features/markdown/components/PreviewPane.vue'
import StatusBar from '@/features/markdown/components/StatusBar.vue'
import Toolbar from '@/features/markdown/components/Toolbar.vue'
import { useMarkdownEditor } from '@/features/markdown/composables/useMarkdownEditor'

// Use the composable
const {
  clearContent,
  content,
  copyContent,
  isCopied,
  loadExample,
  renderedHtml,
  renderMermaidDiagrams,
  setTheme,
  setViewMode,
  stats,
  theme,
  updateContent,
  viewMode,
} = useMarkdownEditor()

interface ThemeChangeRequest {
  origin: { x: number; y: number }
  theme: Theme
}

const { transitionTheme } = useThemeTransition()
const mobileBreakpoint = 700

// Local state
const isExamplesModalOpen = shallowRef(false)
const isMobile = shallowRef(false)
const editorPaneRef = useTemplateRef<InstanceType<typeof EditorPane>>('editorPane')
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

function handleContentUpdate(value: string): void {
  updateContent(value)
}

function handleExampleSelect(example: Example): void {
  loadExample(example)
  // Focus the editor after loading
  setTimeout(() => {
    editorPaneRef.value?.focus()
  }, 0)
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
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<template>
  <div class="markdown-studio" :class="bodyClasses">
    <Toolbar
      :available-modes="availableModes"
      :is-mobile="isMobile"
      :view-mode="viewMode"
      :theme="theme"
      :is-copied="isCopied"
      @update:view-mode="handleViewModeChange"
      @update:theme="handleThemeChange"
      @open-examples="openExamples"
      @clear="clearContent"
      @copy="copyContent"
    />

    <main class="main-content">
      <EditorPane
        ref="editorPane"
        :content="content"
        :line-count="stats.lines"
        @update:content="handleContentUpdate"
      />
      <PreviewPane
        :html="renderedHtml"
        :theme="theme"
        :word-count="stats.words"
        @render-diagrams="handleRenderDiagrams"
      />
    </main>

    <StatusBar :chars="stats.chars" :diagrams="stats.diagrams" />

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
