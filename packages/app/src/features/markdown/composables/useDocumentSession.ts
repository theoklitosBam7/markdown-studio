import type { AppCommand } from '@markdown-studio/desktop-contract/types'

import {
  computed,
  type ComputedRef,
  type DeepReadonly,
  readonly,
  shallowRef,
  type ShallowRef,
  watch,
} from 'vue'

import { useDocumentActions } from './useDocumentActions'

interface UseDocumentSessionOptions {
  content: DeepReadonly<ShallowRef<string>>
  replaceContent: (value: string) => void
}

interface UseDocumentSessionReturn {
  canOpenDocuments: ComputedRef<boolean>
  canSaveDocuments: ComputedRef<boolean>
  currentPath: DeepReadonly<ShallowRef<null | string>>
  displayName: ComputedRef<string>
  handleAppCommand: (command: AppCommand) => Promise<void>
  isDesktop: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  loadExampleDocument: (input: { content: string; title: string }) => Promise<void>
  openDocument: () => Promise<void>
  restoreDraft: (input: { content: string; label: string }) => Promise<void>
  restoreLastOpenedDocument: () => Promise<void>
  saveDocument: () => Promise<void>
  saveDocumentAs: () => Promise<void>
  startNewDocument: () => Promise<void>
  statusText: ComputedRef<string>
}

export function useDocumentSession(options: UseDocumentSessionOptions): UseDocumentSessionReturn {
  const documents = useDocumentActions()
  const currentPath = shallowRef<null | string>(null)
  const draftLabel = shallowRef<null | string>(null)
  const lastAction = shallowRef('Ready')
  const savedContent = shallowRef(options.content.value)

  const { canOpenDocuments, canSaveDocuments, isDesktop } = documents
  const isDirty = computed(() => options.content.value !== savedContent.value)
  const displayName = computed(() =>
    currentPath.value ? getFileName(currentPath.value) : (draftLabel.value ?? 'Untitled.md'),
  )
  const statusText = computed(() => {
    const dirtySuffix = isDirty.value ? ' • Edited' : ''
    return `${lastAction.value}${dirtySuffix}`
  })

  function syncDocumentTitle(): void {
    if (typeof document === 'undefined') return

    document.title = `${displayName.value}${isDirty.value ? ' •' : ''} · Markdown Studio`
    document.documentElement.dataset.desktop = String(isDesktop.value)
    document.documentElement.toggleAttribute('data-document-dirty', isDirty.value)
    document.documentElement.dataset.documentName = displayName.value
  }

  async function confirmDiscardChanges(): Promise<boolean> {
    if (!isDirty.value || typeof window === 'undefined') {
      return true
    }

    return window.confirm('Discard unsaved changes?')
  }

  async function openDocument(): Promise<void> {
    if (!(await confirmDiscardChanges())) return

    const opened = await documents.open()
    if (!opened) return

    options.replaceContent(opened.content)
    currentPath.value = opened.path
    draftLabel.value = null
    savedContent.value = opened.content
    lastAction.value = `Opened ${getFileName(opened.path)}`
    syncDocumentTitle()
  }

  async function restoreDraft(input: { content: string; label: string }): Promise<void> {
    if (!(await confirmDiscardChanges())) return

    options.replaceContent(input.content)
    currentPath.value = null
    draftLabel.value = input.label || 'Untitled.md'
    savedContent.value = ''
    lastAction.value = 'Restored local draft'
    syncDocumentTitle()
  }

  async function restoreLastOpenedDocument(): Promise<void> {
    const restored = await documents.restoreLastOpened()
    if (!restored) return

    options.replaceContent(restored.content)
    currentPath.value = restored.path
    draftLabel.value = null
    savedContent.value = restored.content
    lastAction.value = `Restored ${getFileName(restored.path)}`
    syncDocumentTitle()
  }

  async function loadExampleDocument(input: { content: string; title: string }): Promise<void> {
    await documents.clearCurrentDocumentReference()
    options.replaceContent(input.content)
    currentPath.value = null
    draftLabel.value = null
    savedContent.value = input.content
    lastAction.value = `Loaded example: ${input.title}`
    syncDocumentTitle()
  }

  async function saveDocument(): Promise<void> {
    const saved = await documents.save({
      content: options.content.value,
      path: currentPath.value,
    })

    if (!saved) return

    currentPath.value = saved.path
    draftLabel.value = null
    savedContent.value = options.content.value
    lastAction.value = `Saved ${getFileName(saved.path)}`
    syncDocumentTitle()
  }

  async function saveDocumentAs(): Promise<void> {
    const saved = await documents.saveAs({
      content: options.content.value,
      suggestedPath: currentPath.value ?? displayName.value,
    })

    if (!saved) return

    currentPath.value = saved.path
    draftLabel.value = null
    savedContent.value = options.content.value
    lastAction.value = `Saved ${getFileName(saved.path)}`
    syncDocumentTitle()
  }

  async function startNewDocument(): Promise<void> {
    if (!(await confirmDiscardChanges())) return

    await documents.clearCurrentDocumentReference()
    options.replaceContent('')
    currentPath.value = null
    draftLabel.value = null
    savedContent.value = ''
    lastAction.value = 'Started a new document'
    syncDocumentTitle()
  }

  async function handleAppCommand(command: AppCommand): Promise<void> {
    switch (command) {
      case 'document:open':
        await openDocument()
        return
      case 'document:save':
        await saveDocument()
        return
      case 'document:saveAs':
        await saveDocumentAs()
        return
      default:
        console.warn(`Unhandled app command: ${command}`)
    }
  }

  syncDocumentTitle()
  watch([displayName, isDirty, isDesktop], syncDocumentTitle, { immediate: true })

  return {
    canOpenDocuments,
    canSaveDocuments,
    currentPath: readonly(currentPath),
    displayName,
    handleAppCommand,
    isDesktop,
    isDirty,
    loadExampleDocument,
    openDocument,
    restoreDraft,
    restoreLastOpenedDocument,
    saveDocument,
    saveDocumentAs,
    startNewDocument,
    statusText,
  }
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath
}
