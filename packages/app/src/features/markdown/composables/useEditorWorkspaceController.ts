import type { AppCommand } from '@markdown-studio/desktop-contract/types'

import { computed, nextTick, shallowRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'
import { usePwa } from '@/composables/usePwa'
import { useThemeTransition } from '@/composables/useThemeTransition'
import { useUpdateChecker } from '@/composables/useUpdateChecker'

import type { ViewMode } from '../types'
import type {
  EditorPaneAdapter,
  EditorScrollPayload,
  EditorWorkspaceController,
  PreviewPaneAdapter,
  ThemeChangeRequest,
} from '../types/workspace'

import { useDocumentExport } from './useDocumentExport'
import { useDocumentSession } from './useDocumentSession'
import { useFindReplace } from './useFindReplace'
import { useMarkdownEditor } from './useMarkdownEditor'
import { useWebDraftPersistence } from './useWebDraftPersistence'

const MOBILE_BREAKPOINT = 700

/**
 * Initial controller boundary for editor workspace orchestration.
 *
 * This module intentionally preserves the current behavior while moving the
 * integration seams out of the route view. Follow-up issues can deepen the
 * controller further without re-introducing view-level coordination.
 */
export function useEditorWorkspaceController(): EditorWorkspaceController {
  const editorPane = shallowRef<EditorPaneAdapter | null>(null)
  const previewPane = shallowRef<null | PreviewPaneAdapter>(null)
  const isExamplesModalOpen = shallowRef(false)
  const isMobile = shallowRef(false)

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
    openFind,
    openReplace,
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
  const { canExportPdf, exportHtml, exportPdf, pdfExportUnavailableReason } = useDocumentExport({
    content,
    currentPath,
    displayName,
    isMobile,
  })
  const { clearDraft, restoreStoredDraft } = useWebDraftPersistence({
    content,
    displayName,
    isDesktop,
    isDirty,
    restoreDraft,
  })

  const bannerStatus = computed(() =>
    updateAvailable.value ? ('update-available' as const) : ('up-to-date' as const),
  )
  const pwaBannerStatus = computed(() =>
    needRefresh.value ? ('update-available' as const) : ('offline-ready' as const),
  )
  const showPwaBanner = computed(
    () => !desktop.value.isDesktop && (needRefresh.value || offlineReady.value),
  )
  const availableModes = computed(() =>
    isMobile.value
      ? (['editor', 'preview'] satisfies ViewMode[])
      : (['editor', 'split', 'preview'] satisfies ViewMode[]),
  )
  const bodyClasses = computed(() => ({
    'is-mobile': isMobile.value,
    'view-editor': viewMode.value === 'editor',
    'view-preview': viewMode.value === 'preview',
    'view-split': viewMode.value === 'split',
  }))

  let removeDesktopCommandListener: () => void = () => undefined

  watch(
    theme,
    (newTheme) => {
      document.documentElement.setAttribute('data-theme', newTheme)
    },
    { immediate: true },
  )

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

  function attachEditor(adapter: EditorPaneAdapter): void {
    editorPane.value = adapter
  }

  function attachPreview(adapter: PreviewPaneAdapter): void {
    previewPane.value = adapter
  }

  function closeExamples(): void {
    isExamplesModalOpen.value = false
  }

  function openExamples(): void {
    isExamplesModalOpen.value = true
  }

  function focusFindQuery(): void {
    void nextTick(() => {
      editorPane.value?.focusFindQuery()
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

  async function handleDesktopCommand(command: AppCommand): Promise<void> {
    switch (command) {
      case 'document:exportHtml':
        await exportHtml()
        return
      case 'document:exportPdf':
        if (canExportPdf.value) {
          await exportPdf()
        }
        return
      case 'editor:find':
        openFindPanel()
        return
      case 'editor:replace':
        openReplacePanel()
        return
      case 'update:check':
        await checkNow()
        return
      default:
        await handleAppCommand(command)
    }
  }

  function openFindPanel(): void {
    openFind()
    focusFindQuery()
  }

  function openReplacePanel(): void {
    openReplace()
    focusFindQuery()
  }

  function syncFindSelection(): void {
    const match = activeMatch.value
    if (!match) {
      return
    }

    void nextTick(() => {
      void editorPane.value?.setSelectionRange(match.index, match.end)
    })
  }

  function syncPreviewToEditorPosition(scrollState?: EditorScrollPayload | null): void {
    if (isMobile.value || viewMode.value !== 'split') return

    const effectiveScrollState = scrollState ?? editorPane.value?.getScrollState()
    if (!effectiveScrollState) return

    const topLine = Math.max(
      0,
      Math.floor(effectiveScrollState.scrollTop / effectiveScrollState.lineHeight),
    )
    const sourceOffset = getOffsetForLine(content.value, topLine)
    previewPane.value?.scrollToSourceOffset(sourceOffset)
  }

  function syncViewport(width: number): void {
    const nextIsMobile = width <= MOBILE_BREAKPOINT
    isMobile.value = nextIsMobile

    if (nextIsMobile && viewMode.value === 'split') {
      setViewMode('editor')
    }
  }

  async function replaceAll(): Promise<void> {
    const replacementPlan = prepareReplaceAll()
    if (!replacementPlan) {
      return
    }

    await editorPane.value?.replaceAllContent(replacementPlan.nextContent)
    commitReplacement(replacementPlan.nextActiveIndex)
    editorPane.value?.focus()
  }

  async function replaceCurrent(): Promise<void> {
    const replacementPlan = prepareReplaceCurrent()
    if (!replacementPlan) {
      return
    }

    await editorPane.value?.replaceRange(
      replacementPlan.match.index,
      replacementPlan.match.end,
      replacementPlan.replacement,
    )
    commitReplacement(replacementPlan.nextActiveIndex)
    editorPane.value?.focus()
  }

  async function startNew(): Promise<void> {
    await startNewDocument()
    if (!content.value) {
      clearDraft()
    }
  }

  async function setWorkspaceTheme(request: ThemeChangeRequest): Promise<void> {
    if (request.theme === theme.value) return

    await transitionTheme(request.theme, setTheme, {
      origin: request.origin,
    })
  }

  async function loadWorkspaceExample(example: Parameters<typeof loadExample>[0]): Promise<void> {
    loadExample(example)
    setTimeout(() => {
      editorPane.value?.focus()
    }, 0)
  }

  async function jumpToOffset(offset: number): Promise<void> {
    if (isMobile.value || viewMode.value !== 'split') return

    await editorPane.value?.focusAtOffset(offset)
  }

  async function start(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    syncViewport(window.innerWidth)
    window.addEventListener('resize', handleWindowResize)
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
  }

  function stop(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleWindowResize)
      window.removeEventListener('keydown', handleGlobalKeydown)
    }

    removeDesktopCommandListener()
    removeDesktopCommandListener = () => undefined
    stopUpdateChecks()
  }

  function handleWindowResize(): void {
    handleViewportResize(window.innerWidth)
  }

  function handleViewportResize(width: number): void {
    syncViewport(width)
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return
    }

    const normalizedKey = event.key.toLowerCase()
    const hasCommandModifier = event.metaKey || event.ctrlKey

    if (hasCommandModifier && normalizedKey === 'f') {
      event.preventDefault()
      openFindPanel()
      return
    }

    if (hasCommandModifier && normalizedKey === 'h') {
      event.preventDefault()
      openReplacePanel()
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

  function closeFind(): void {
    closeFindReplace()
    editorPane.value?.focus()
  }

  function dismissPwaBanner(): void {
    if (needRefresh.value) {
      dismissRefreshPrompt()
      return
    }

    dismissOfflineReady()
  }

  async function installApp(): Promise<void> {
    await install()
  }

  return {
    attach: {
      editor: attachEditor,
      preview: attachPreview,
    },
    document: {
      async handleAppCommand(command: AppCommand): Promise<void> {
        await handleDesktopCommand(command)
      },
      async open(): Promise<void> {
        await openDocument()
      },
      async restoreDraft(): Promise<void> {
        await restoreStoredDraft()
      },
      async save(): Promise<void> {
        await saveDocument()
      },
      async startNew(): Promise<void> {
        await startNew()
      },
    },
    editor: {
      async loadExample(example) {
        await loadWorkspaceExample(example)
      },
      async setTheme(request: ThemeChangeRequest) {
        await setWorkspaceTheme(request)
      },
      setViewMode,
      syncPreviewToEditorPosition,
      updateContent,
    },
    examples: {
      close: closeExamples,
      open: openExamples,
    },
    export: {
      async html(): Promise<void> {
        await exportHtml()
      },
      async pdf(): Promise<void> {
        await exportPdf()
      },
    },
    find: {
      close: closeFind,
      next: findNext,
      open: openFindPanel,
      openReplace: openReplacePanel,
      previous: findPrevious,
      async replaceAll(): Promise<void> {
        await replaceAll()
      },
      async replaceCurrent(): Promise<void> {
        await replaceCurrent()
      },
      setMatchCase,
      setQuery,
      setReplaceText,
    },
    preview: {
      async jumpToOffset(offset: number): Promise<void> {
        await jumpToOffset(offset)
      },
      async renderDiagrams(container: HTMLElement): Promise<void> {
        await renderMermaidDiagrams(container)
      },
    },
    state: {
      activeMatchIndex,
      availableModes,
      bannerStatus,
      bodyClasses,
      canExportPdf,
      canInstall,
      canOpenDocuments,
      canSaveDocuments,
      content,
      currentPath,
      displayName,
      isCopied,
      isDesktop,
      isDirty,
      isExamplesModalOpen,
      isFindReplaceOpen,
      isMobile,
      matchCase,
      matchCount,
      matches,
      needRefresh,
      offlineReady,
      pdfExportUnavailableReason,
      pwaBannerStatus,
      query,
      renderedHtml,
      replaceText,
      showBanner,
      showPwaBanner,
      showReplace,
      sourceMap,
      stats,
      statusText,
      theme,
      updateAvailable,
      updateInfo,
      viewMode,
    },
    system: {
      handleGlobalKeydown,
      handleViewportResize,
      start,
      stop,
    },
    toolbar: {
      copy: copyContent,
      dismissPwaBanner,
      dismissUpdateBanner,
      downloadUpdate,
      install: installApp,
      updateApp,
    },
  }
}
