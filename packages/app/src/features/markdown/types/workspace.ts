import type { AppCommand } from '@markdown-studio/desktop-contract/types'
import type { ComputedRef, Ref, ShallowRef } from 'vue'

import type { FindMatch } from '../composables/useFindReplace'
import type { EditorStats, Example, MarkdownSourceMapEntry, Theme, ViewMode } from './common'

/**
 * Imperative capabilities exposed by the editor pane.
 *
 * The workspace controller depends on this adapter instead of the concrete Vue
 * component instance so orchestration can move away from the route view without
 * coupling the controller to a specific UI implementation.
 */
export interface EditorPaneAdapter {
  focus(): void
  focusAtOffset(offset: number): Promise<void>
  focusFindQuery(): void
  getScrollState(): EditorScrollPayload | null
  replaceAllContent(content: string): Promise<void>
  replaceRange(start: number, end: number, replacement: string): Promise<void>
  setSelectionRange(start: number, end: number): Promise<void>
}

/**
 * Shared scroll payload used by the editor pane and workspace controller.
 *
 * The initial controller boundary keeps this shape intentionally close to the
 * existing pane contract so follow-up refactors can move behavior without
 * changing runtime semantics.
 */
export interface EditorScrollPayload {
  clientHeight: number
  contentLength: number
  lineHeight: number
  scrollHeight: number
  scrollTop: number
}

export interface EditorWorkspaceController {
  attach: {
    editor(adapter: EditorPaneAdapter | null): void
    preview(adapter: null | PreviewPaneAdapter): void
  }
  document: {
    handleAppCommand(command: AppCommand): Promise<void>
    open(): Promise<void>
    restoreDraft(): Promise<void>
    save(): Promise<void>
    startNew(): Promise<void>
  }
  editor: {
    loadExample(example: Example): Promise<void>
    setTheme(request: ThemeChangeRequest): Promise<void>
    setViewMode(mode: ViewMode): void
    syncPreviewToEditorPosition(payload?: EditorScrollPayload | null): void
    updateContent(value: string): void
  }
  examples: {
    close(): void
    open(): void
  }
  export: {
    html(): Promise<void>
    pdf(): Promise<void>
  }
  find: {
    dispatch(action: EditorWorkspaceFindAction): Promise<void>
    state: ComputedRef<EditorWorkspaceFindState>
  }
  preview: {
    jumpToOffset(offset: number): Promise<void>
    renderDiagrams(container: HTMLElement): Promise<void>
  }
  state: EditorWorkspaceState
  system: {
    handleGlobalKeydown(event: KeyboardEvent): void
    handleViewportResize(width: number): void
    start(): Promise<void>
    stop(): void
  }
  toolbar: {
    copy(): Promise<void>
    dismissPwaBanner(): void
    dismissUpdateBanner(): void
    downloadUpdate(): void
    install(): Promise<void>
    updateApp(): Promise<void>
  }
}

export type EditorWorkspaceFindAction =
  | { type: 'close' }
  | { type: 'next' }
  | { type: 'open-replace' }
  | { type: 'open' }
  | { type: 'previous' }
  | { type: 'replace-all' }
  | { type: 'replace-current' }
  | { type: 'set-match-case'; value: boolean }
  | { type: 'set-query'; value: string }
  | { type: 'set-replace-text'; value: string }

export interface EditorWorkspaceFindState {
  activeMatchIndex: number
  isOpen: boolean
  matchCase: boolean
  matchCount: number
  matches: FindMatch[]
  query: string
  replaceText: string
  showReplace: boolean
}

/**
 * Controller-facing state shape consumed by the workspace view.
 *
 * The view intentionally reads from this object and forwards events back into
 * controller methods. This makes the route component a composition surface
 * rather than the primary orchestration owner.
 */
export interface EditorWorkspaceState {
  availableModes: Readonly<Ref<ViewMode[]>>
  bannerStatus: Readonly<Ref<'up-to-date' | 'update-available'>>
  bodyClasses: ComputedRef<Record<string, boolean>>
  canExportPdf: Readonly<Ref<boolean>>
  canInstall: Readonly<Ref<boolean>>
  canOpenDocuments: Readonly<Ref<boolean>>
  canSaveDocuments: Readonly<Ref<boolean>>
  content: Readonly<Ref<string>>
  currentPath: Readonly<Ref<null | string>>
  displayName: Readonly<Ref<string>>
  isCopied: Readonly<Ref<boolean>>
  isDesktop: Readonly<Ref<boolean>>
  isDirty: Readonly<Ref<boolean>>
  isExamplesModalOpen: ShallowRef<boolean>
  isMobile: ShallowRef<boolean>
  needRefresh: Readonly<Ref<boolean>>
  offlineReady: Readonly<Ref<boolean>>
  pdfExportUnavailableReason: Readonly<Ref<string>>
  pwaBannerStatus: Readonly<Ref<'offline-ready' | 'update-available'>>
  renderedHtml: Readonly<Ref<string>>
  showBanner: Readonly<Ref<boolean>>
  showPwaBanner: Readonly<Ref<boolean>>
  sourceMap: Readonly<Ref<MarkdownSourceMapEntry[]>>
  stats: Readonly<Ref<EditorStats>>
  statusText: Readonly<Ref<string>>
  theme: Readonly<Ref<Theme>>
  updateAvailable: Readonly<Ref<boolean>>
  updateInfo: Readonly<Ref<null | WorkspaceUpdateInfo>>
  viewMode: Readonly<Ref<ViewMode>>
}

export interface PreviewPaneAdapter {
  scrollToSourceOffset(offset: number): void
}

export interface ThemeChangeRequest {
  origin: { x: number; y: number }
  theme: Theme
}

export interface WorkspaceUpdateInfo {
  currentVersion: string
  latestVersion: string
  releaseUrl: string
}
