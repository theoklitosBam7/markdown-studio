<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { Example, Theme, ViewMode } from '@/features/markdown/types'

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
  setViewMode,
  stats,
  theme,
  toggleTheme,
  updateContent,
  viewMode,
} = useMarkdownEditor()

// Local state
const isExamplesModalOpen = shallowRef(false)
const editorPaneRef = useTemplateRef<InstanceType<typeof EditorPane>>('editorPane')

// Computed body classes for view mode and theme
const bodyClasses = computed(() => ({
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

function handleThemeChange(newTheme: Theme): void {
  // The theme toggle emits the new theme value, but we need to toggle
  // Since toggleTheme() toggles internally, we should sync the values
  if (newTheme !== theme.value) {
    toggleTheme()
  }
}

// Actions
function handleViewModeChange(mode: ViewMode): void {
  setViewMode(mode)
}

function openExamples(): void {
  isExamplesModalOpen.value = true
}
</script>

<template>
  <div class="markdown-studio" :class="bodyClasses">
    <Toolbar
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
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
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
  .markdown-studio.view-split :deep(.editor-pane) {
    display: none;
  }

  .markdown-studio.view-split :deep(.preview-pane) {
    display: flex;
  }
}
</style>
