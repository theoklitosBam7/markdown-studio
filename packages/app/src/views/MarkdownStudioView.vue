<script setup lang="ts">
import type { AppCommand } from '@markdown-studio/desktop-contract/types'

import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import type { Example, Theme, ViewMode } from '@/features/markdown/types'

import { useDesktop } from '@/composables/useDesktop'
import { usePwa } from '@/composables/usePwa'
import { useThemeTransition } from '@/composables/useThemeTransition'
import { useUpdateChecker } from '@/composables/useUpdateChecker'
import EditorPane from '@/features/markdown/components/EditorPane.vue'
import ExamplesModal from '@/features/markdown/components/ExamplesModal.vue'
import PreviewPane from '@/features/markdown/components/PreviewPane.vue'
import PwaBanner from '@/features/markdown/components/PwaBanner.vue'
import StatusBar from '@/features/markdown/components/StatusBar.vue'
import Toolbar from '@/features/markdown/components/Toolbar.vue'
import UpdateBanner from '@/features/markdown/components/UpdateBanner.vue'
import { useDocumentExport } from '@/features/markdown/composables/useDocumentExport'
import { useDocumentSession } from '@/features/markdown/composables/useDocumentSession'
import { useFindReplace } from '@/features/markdown/composables/useFindReplace'
import { useMarkdownEditor } from '@/features/markdown/composables/useMarkdownEditor'
import { useWebDraftPersistence } from '@/features/markdown/composables/useWebDraftPersistence'

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
  currentPath,
  displayName,
  handleAppCommand,
  isDesktop,
  isDirty,
  openDocument,
  restoreDraft,
  saveDocument,
  startNewDocument,
  statusText,
} = useDocumentSession({
  content,
  replaceContent: updateContent,
})
const { exportHtml, exportPdf } = useDocumentExport({
  content,
  currentPath,
  displayName,
})
const {
  activeMatch,
  activeMatchIndex,
  close: closeFindReplace,
  commitReplacement,
  findNext,
  findPrevious,
  isOpen: isFindReplaceOpen,
  matchCase,
  matchCount,
  matches,
  openFind: openFindPanel,
  openReplace: openReplacePanel,
  prepareReplaceAll,
  prepareReplaceCurrent,
  query,
  replaceText,
  requestSelectionSync,
  setMatchCase,
  setQuery,
  setReplaceText,
  showReplace,
} = useFindReplace({
  content,
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
const {
  checkNow,
  dismiss: dismissUpdateBanner,
  download: downloadUpdate,
  showBanner,
  startChecking: startUpdateChecks,
  stopChecking: stopUpdateChecks,
  updateAvailable,
  updateInfo,
} = useUpdateChecker()
const {
  canInstall,
  dismissOfflineReady,
  dismissRefreshPrompt,
  install,
  needRefresh,
  offlineReady,
  updateApp,
} = usePwa()
const mobileBreakpoint = 700

const bannerStatus = computed(() =>
  updateAvailable.value ? ('update-available' as const) : ('up-to-date' as const),
)
const pwaBannerStatus = computed(() =>
  needRefresh.value ? ('update-available' as const) : ('offline-ready' as const),
)
const showPwaBanner = computed(
  () => !desktop.value.isDesktop && (needRefresh.value || offlineReady.value),
)

// Local state
const isExamplesModalOpen = shallowRef(false)
const isMobile = shallowRef(false)
let removeDesktopCommandListener: () => void = () => undefined
const editorPaneRef = useTemplateRef<InstanceType<typeof EditorPane>>('editorPane')
const previewPaneRef = useTemplateRef<InstanceType<typeof PreviewPane>>('previewPane')
const availableModes = computed<ViewMode[]>(() =>
  isMobile.value ? ['editor', 'preview'] : ['editor', 'split', 'preview'],
)

// Note: restoreStoredDraft must be called after useDocumentSession initializes restoreDraft.
const { clearDraft, restoreStoredDraft } = useWebDraftPersistence({
  content,
  displayName,
  isDesktop,
  isDirty,
  restoreDraft,
})

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

function focusFindQuery(): void {
  void nextTick(() => {
    editorPaneRef.value?.focusFindQuery()
  })
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

function handleExportHtml(): void {
  void exportHtml().catch((error: unknown) => {
    console.error('Failed to export HTML:', error)
  })
}

function handleExportPdf(): void {
  void exportPdf().catch((error: unknown) => {
    console.error('Failed to export PDF:', error)
  })
}

function handleFindClose(): void {
  closeFindReplace()
  editorPaneRef.value?.focus()
}

function handleFindQueryUpdate(value: string): void {
  setQuery(value)
}

function handleFindReplaceShortcut(): void {
  openReplacePanel()
  focusFindQuery()
}

function handleFindShortcut(): void {
  openFindPanel()
  focusFindQuery()
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) {
    return
  }

  const normalizedKey = event.key.toLowerCase()
  const hasCommandModifier = event.metaKey || event.ctrlKey

  if (hasCommandModifier && normalizedKey === 'f') {
    event.preventDefault()
    handleFindShortcut()
    return
  }

  if (hasCommandModifier && normalizedKey === 'h') {
    event.preventDefault()
    handleFindReplaceShortcut()
    return
  }

  if (!isFindReplaceOpen.value) {
    return
  }

  if ((hasCommandModifier && normalizedKey === 'g') || event.key === 'F3') {
    event.preventDefault()
    if (event.shiftKey) {
      findPrevious()
      return
    }

    findNext()
  }
}

function handleInstall(): void {
  void install().catch((error: unknown) => {
    console.error('Failed to trigger web app install:', error)
  })
}

function handlePreviewJump(offset: number): void {
  if (isMobile.value || viewMode.value !== 'split') return

  void editorPaneRef.value?.focusAtOffset(offset)
}

function handlePwaBannerDismiss(): void {
  if (needRefresh.value) {
    dismissRefreshPrompt()
    return
  }

  dismissOfflineReady()
}

function handleRenderDiagrams(container: HTMLElement): void {
  renderMermaidDiagrams(container)
}

async function handleReplaceAll(): Promise<void> {
  const replacementPlan = prepareReplaceAll()
  if (!replacementPlan) {
    return
  }

  await editorPaneRef.value?.replaceAllContent(replacementPlan.nextContent)
  commitReplacement(replacementPlan.nextActiveIndex)
  editorPaneRef.value?.focus()
}

async function handleReplaceCurrent(): Promise<void> {
  const replacementPlan = prepareReplaceCurrent()
  if (!replacementPlan) {
    return
  }

  await editorPaneRef.value?.replaceRange(
    replacementPlan.match.index,
    replacementPlan.match.end,
    replacementPlan.replacement,
  )
  commitReplacement(replacementPlan.nextActiveIndex)
  editorPaneRef.value?.focus()
}

function handleStartNewDocument(): void {
  void startNewDocument()
    .then(() => {
      if (!content.value) {
        clearDraft()
      }
    })
    .catch((error: unknown) => {
      console.error('Failed to start new document:', error)
    })
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

function syncFindSelection(): void {
  const match = activeMatch.value
  if (!match) {
    return
  }

  void nextTick(() => {
    editorPaneRef.value?.setSelectionRange(match.index, match.end)
  })
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

onMounted(async () => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
  window.addEventListener('keydown', handleGlobalKeydown)
  startUpdateChecks()
  await restoreStoredDraft()

  const onAppCommand = desktop.value?.commands?.onAppCommand
  if (onAppCommand) {
    removeDesktopCommandListener = onAppCommand((command: AppCommand) => {
      void handleDesktopCommand(command).catch((error: unknown) => {
        console.error('Failed to handle desktop app command:', error)
      })
    })
  } else {
    removeDesktopCommandListener = () => undefined
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)
  window.removeEventListener('keydown', handleGlobalKeydown)
  removeDesktopCommandListener()
  stopUpdateChecks()
})

watch(
  () => [content.value, isMobile.value, sourceMap.value, viewMode.value],
  async () => {
    await nextTick()
    syncPreviewToEditorPosition()
  },
  { deep: true },
)

watch(requestSelectionSync, () => {
  syncFindSelection()
})

async function handleDesktopCommand(command: AppCommand): Promise<void> {
  switch (command) {
    case 'document:exportHtml':
      await exportHtml()
      return
    case 'document:exportPdf':
      await exportPdf()
      return
    case 'editor:find':
      handleFindShortcut()
      return
    case 'editor:replace':
      handleFindReplaceShortcut()
      return
    case 'update:check':
      await checkNow()
      return
    default:
      await handleAppCommand(command)
  }
}
</script>

<template>
  <div class="markdown-studio" :class="bodyClasses">
    <Toolbar
      :available-modes="availableModes"
      :can-open-documents="canOpenDocuments"
      :can-install="canInstall"
      :can-save-documents="canSaveDocuments"
      :is-mobile="isMobile"
      :view-mode="viewMode"
      :theme="theme"
      :is-copied="isCopied"
      @install="handleInstall"
      @open-document="openDocument"
      @update:view-mode="handleViewModeChange"
      @update:theme="handleThemeChange"
      @open-examples="openExamples"
      @clear="handleStartNewDocument"
      @copy="copyContent"
      @export-html="handleExportHtml"
      @export-pdf="handleExportPdf"
      @save-document="saveDocument"
    />

    <Transition name="banner-slide">
      <UpdateBanner
        v-if="showBanner"
        :status="bannerStatus"
        :current-version="updateInfo?.currentVersion"
        :latest-version="updateInfo?.latestVersion"
        @dismiss="dismissUpdateBanner"
        @download="downloadUpdate"
      />
    </Transition>

    <Transition name="banner-slide">
      <PwaBanner
        v-if="showPwaBanner"
        :status="pwaBannerStatus"
        @dismiss="handlePwaBannerDismiss"
        @refresh="updateApp"
      />
    </Transition>

    <main class="main-content">
      <EditorPane
        ref="editorPane"
        :active-match-index="activeMatchIndex"
        :content="content"
        :find-open="isFindReplaceOpen"
        :line-count="stats.lines"
        :match-case="matchCase"
        :match-count="matchCount"
        :matches="matches"
        :query="query"
        :replace-text="replaceText"
        :show-replace="showReplace"
        @find:close="handleFindClose"
        @find:next="findNext"
        @find:previous="findPrevious"
        @find:replace-all="handleReplaceAll"
        @find:replace-current="handleReplaceCurrent"
        @request-find="handleFindShortcut"
        @request-replace="handleFindReplaceShortcut"
        @scroll="handleEditorScroll"
        @update:content="handleContentUpdate"
        @update:match-case="setMatchCase"
        @update:query="handleFindQueryUpdate"
        @update:replace-text="setReplaceText"
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
