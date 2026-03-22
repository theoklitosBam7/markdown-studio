import {
  computed,
  type ComputedRef,
  type DeepReadonly,
  readonly,
  shallowRef,
  type ShallowRef,
  watch,
} from 'vue'

import { useDesktop } from '@/composables/useDesktop'

import type { AppCommand } from '../../../../electron/shared/types'

interface UseDocumentSessionOptions {
  content: DeepReadonly<ShallowRef<string>>
  replaceContent: (value: string) => void
}

interface UseDocumentSessionReturn {
  currentPath: DeepReadonly<ShallowRef<null | string>>
  displayName: ComputedRef<string>
  handleAppCommand: (command: AppCommand) => Promise<void>
  isDesktop: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  openDocument: () => Promise<void>
  saveDocument: () => Promise<void>
  saveDocumentAs: () => Promise<void>
  startNewDocument: () => Promise<void>
  statusText: ComputedRef<string>
}

export function useDocumentSession(options: UseDocumentSessionOptions): UseDocumentSessionReturn {
  const desktop = useDesktop()
  const currentPath = shallowRef<null | string>(null)
  const lastAction = shallowRef('Ready')
  const savedContent = shallowRef(options.content.value)

  const isDesktop = computed(() => desktop.value.isDesktop)
  const isDirty = computed(() => options.content.value !== savedContent.value)
  const displayName = computed(() =>
    currentPath.value ? getFileName(currentPath.value) : 'Untitled.md',
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

    const opened = await desktop.value.documents.open()
    if (!opened) return

    options.replaceContent(opened.content)
    currentPath.value = opened.path
    savedContent.value = opened.content
    lastAction.value = `Opened ${getFileName(opened.path)}`
    syncDocumentTitle()
  }

  async function saveDocument(): Promise<void> {
    const saved = await desktop.value.documents.save({
      content: options.content.value,
      path: currentPath.value,
    })

    if (!saved) return

    currentPath.value = saved.path
    savedContent.value = options.content.value
    lastAction.value = `Saved ${getFileName(saved.path)}`
    syncDocumentTitle()
  }

  async function saveDocumentAs(): Promise<void> {
    const saved = await desktop.value.documents.saveAs({
      content: options.content.value,
      suggestedPath: currentPath.value ?? displayName.value,
    })

    if (!saved) return

    currentPath.value = saved.path
    savedContent.value = options.content.value
    lastAction.value = `Saved ${getFileName(saved.path)}`
    syncDocumentTitle()
  }

  async function startNewDocument(): Promise<void> {
    if (!(await confirmDiscardChanges())) return

    options.replaceContent('')
    currentPath.value = null
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
    currentPath: readonly(currentPath),
    displayName,
    handleAppCommand,
    isDesktop,
    isDirty,
    openDocument,
    saveDocument,
    saveDocumentAs,
    startNewDocument,
    statusText,
  }
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath
}
