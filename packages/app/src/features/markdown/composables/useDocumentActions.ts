import { computed, type ComputedRef } from 'vue'

import type { AppWindow } from '@/browser-window'

import { useDesktop } from '@/composables/useDesktop'
import { revokeObjectUrlLater } from '@/utils/objectUrl'

interface BrowserOpenResult {
  file: File
  handle?: FileSystemFileHandle
}

interface DocumentActions {
  canOpenDocuments: ComputedRef<boolean>
  canSaveDocuments: ComputedRef<boolean>
  clearCurrentDocumentReference: () => Promise<void>
  isDesktop: ComputedRef<boolean>
  open: () => Promise<DocumentHandle | null>
  restoreLastOpened: () => Promise<DocumentHandle | null>
  save: (input: SaveDocumentInput) => Promise<{ path: string } | null>
  saveAs: (input: SaveDocumentAsInput) => Promise<{ path: string } | null>
}

interface DocumentHandle {
  content: string
  path: string
}

interface SaveDocumentAsInput {
  content: string
  suggestedPath?: null | string
}

interface SaveDocumentInput {
  content: string
  path: null | string
}

export function useDocumentActions(): DocumentActions {
  const desktop = useDesktop()

  const isDesktop = computed(() => desktop.value.isDesktop)
  const canOpenDocuments = computed(() => isDesktop.value || typeof window !== 'undefined')
  const canSaveDocuments = computed(() => isDesktop.value || typeof window !== 'undefined')

  async function open(): Promise<DocumentHandle | null> {
    if (isDesktop.value) {
      return desktop.value.documents.open()
    }

    const opened = await openBrowserDocument()
    if (!opened) return null

    try {
      const content = await readFileAsText(opened.file)
      browserSession.handle = opened.handle ?? null

      return {
        content,
        path: opened.file.name,
      }
    } catch (error) {
      console.error('Failed to open the selected file:', error)
      return null
    }
  }

  async function save(input: SaveDocumentInput): Promise<{ path: string } | null> {
    if (isDesktop.value) {
      return desktop.value.documents.save(input)
    }

    if (browserSession.handle) {
      const path = await writeWithFileHandle(browserSession.handle, input.content)
      return { path }
    }

    return saveAs({
      content: input.content,
      suggestedPath: input.path,
    })
  }

  async function saveAs(input: SaveDocumentAsInput): Promise<{ path: string } | null> {
    if (isDesktop.value) {
      return desktop.value.documents.saveAs(input)
    }

    const suggestedPath = getSuggestedPath(input.suggestedPath)
    const handle = await showBrowserSavePicker(suggestedPath)

    if (handle === null) {
      return null
    }

    if (handle) {
      const path = await writeWithFileHandle(handle, input.content)
      browserSession.handle = handle
      return { path }
    }

    downloadDocument(input.content, suggestedPath)
    browserSession.handle = null
    return { path: suggestedPath }
  }

  async function restoreLastOpened(): Promise<DocumentHandle | null> {
    if (!isDesktop.value) {
      return null
    }

    return desktop.value.documents.restoreLastOpened()
  }

  return {
    canOpenDocuments,
    canSaveDocuments,
    clearCurrentDocumentReference,
    isDesktop,
    open,
    restoreLastOpened,
    save,
    saveAs,
  }
}

const browserSession: { handle: FileSystemFileHandle | null } = {
  handle: null,
}

export function resetBrowserDocumentSessionForTests(): void {
  browserSession.handle = null
}

async function clearCurrentDocumentReference(): Promise<void> {
  browserSession.handle = null

  if (typeof window === 'undefined') return

  const desktop = (window as AppWindow).desktop
  if (desktop?.isDesktop) {
    await desktop.documents.clearLastOpened()
  }
}

function downloadDocument(content: string, fileName: string): void {
  if (typeof document === 'undefined') return

  const anchor = document.createElement('a')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))

  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  revokeObjectUrlLater(url)
}

function getSuggestedPath(inputPath?: null | string): string {
  if (!inputPath) {
    return 'Untitled.md'
  }

  return inputPath.toLowerCase().endsWith('.md') ? inputPath : `${inputPath}.md`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function openBrowserDocument(): Promise<BrowserOpenResult | null> {
  try {
    const openedWithHandle = await showBrowserOpenPicker()
    if (openedWithHandle !== undefined) {
      return openedWithHandle
    }
  } catch (error) {
    console.warn('Falling back to the browser file input after picker failure:', error)
  }

  if (typeof document === 'undefined') return null

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.markdown,.mdown,text/markdown,text/plain'
  input.style.display = 'none'

  let resolveFile: (value: File | null) => void = () => undefined
  let settled = false
  let windowBlurred = false
  let focusTimeoutId: null | number = null

  const finish = (file: File | null): void => {
    if (settled) return
    settled = true
    cleanup()
    resolveFile(file)
  }

  const cleanup = (): void => {
    if (focusTimeoutId !== null) {
      window.clearTimeout(focusTimeoutId)
      focusTimeoutId = null
    }

    input.removeEventListener('change', onChange)
    input.removeEventListener('cancel', onCancel)
    window.removeEventListener('blur', onWindowBlur)
    window.removeEventListener('focus', onWindowFocus)
    input.remove()
  }

  const onChange = (): void => {
    finish(input.files?.[0] ?? null)
  }

  const onCancel = (): void => {
    finish(null)
  }

  const onWindowBlur = (): void => {
    windowBlurred = true
  }

  const onWindowFocus = (): void => {
    if (!windowBlurred) return

    if (focusTimeoutId !== null) {
      window.clearTimeout(focusTimeoutId)
    }

    focusTimeoutId = window.setTimeout(() => {
      focusTimeoutId = null
      finish(input.files?.[0] ?? null)
    }, 300)
  }

  const file = await new Promise<File | null>((resolve) => {
    resolveFile = resolve
    input.addEventListener('change', onChange)
    input.addEventListener('cancel', onCancel)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)

    document.body?.append(input)
    input.click()
  })

  return file ? { file } : null
}

async function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      () => {
        resolve(typeof reader.result === 'string' ? reader.result : '')
      },
      { once: true },
    )
    reader.addEventListener(
      'error',
      () => {
        reject(reader.error ?? new Error('Failed to read the selected file.'))
      },
      { once: true },
    )

    reader.readAsText(file)
  })
}

async function showBrowserOpenPicker(): Promise<BrowserOpenResult | null | undefined> {
  if (typeof window === 'undefined') {
    return undefined
  }

  const browserWindow = window as AppWindow

  if (typeof browserWindow.showOpenFilePicker !== 'function') {
    return undefined
  }

  try {
    const [handle] = await browserWindow.showOpenFilePicker({
      excludeAcceptAllOption: false,
      multiple: false,
      types: [
        {
          accept: {
            'text/markdown': ['.md', '.markdown', '.mdown'],
            'text/plain': ['.txt'],
          },
          description: 'Markdown Files',
        },
      ],
    })

    if (!handle) {
      return null
    }

    return {
      file: await handle.getFile(),
      handle,
    }
  } catch (error) {
    if (isAbortError(error)) {
      return null
    }

    throw error
  }
}

async function showBrowserSavePicker(
  suggestedName: string,
): Promise<FileSystemFileHandle | null | undefined> {
  if (typeof window === 'undefined') {
    return undefined
  }

  const browserWindow = window as AppWindow

  if (typeof browserWindow.showSaveFilePicker !== 'function') {
    return undefined
  }

  try {
    return await browserWindow.showSaveFilePicker({
      excludeAcceptAllOption: false,
      suggestedName,
      types: [
        {
          accept: { 'text/markdown': ['.md', '.markdown', '.mdown'] },
          description: 'Markdown Files',
        },
      ],
    })
  } catch (error) {
    if (isAbortError(error)) {
      return null
    }

    throw error
  }
}

async function writeWithFileHandle(handle: FileSystemFileHandle, content: string): Promise<string> {
  const writable = await handle.createWritable()
  let writeError: unknown

  try {
    await writable.write(content)
  } catch (error) {
    writeError = error
  } finally {
    await writable.close()
  }

  if (writeError) {
    throw writeError
  }

  return handle.name
}
