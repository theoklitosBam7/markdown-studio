import type { DeepReadonly, Ref, ShallowRef } from 'vue'

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useDesktop } from '@/composables/useDesktop'
import { revokeObjectUrlLater } from '@/utils/objectUrl'

import {
  buildMarkdownDocumentHtml,
  getDefaultExportTitle,
  getSuggestedExportFileName,
  renderMarkdownDocument,
} from '../utils/renderMarkdownDocument'

interface UseDocumentExportOptions {
  content: DeepReadonly<ShallowRef<string>>
  currentPath: DeepReadonly<Ref<null | string>>
  displayName: DeepReadonly<Ref<string>>
  isMobile: DeepReadonly<Ref<boolean>>
}

interface UseDocumentExportReturn {
  canExportHtml: Readonly<Ref<boolean>>
  canExportPdf: Readonly<Ref<boolean>>
  exportHtml: () => Promise<void>
  exportPdf: () => Promise<void>
  pdfExportUnavailableReason: Readonly<Ref<string>>
}

const PRINT_JOB_KEY = 'markdown-studio:print-export:'
const PRINT_JOB_WINDOW_NAME_PREFIX = 'markdown-studio:print-export-window:'
const MOBILE_PDF_EXPORT_UNAVAILABLE_REASON =
  "PDF export isn't available on mobile or installed PWAs yet. Use Export as HTML instead."

interface PdfExportSupportInput {
  isDesktop: boolean
  isMobile: boolean
}

export function cleanupPrintJob(jobId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(getPrintJobStorageKey(jobId))
}

export function getPdfExportSupport(input: PdfExportSupportInput): {
  isSupported: boolean
  unavailableReason: string
} {
  if (input.isDesktop) {
    return {
      isSupported: true,
      unavailableReason: '',
    }
  }

  if (input.isMobile) {
    return {
      isSupported: false,
      unavailableReason: MOBILE_PDF_EXPORT_UNAVAILABLE_REASON,
    }
  }

  return {
    isSupported: true,
    unavailableReason: '',
  }
}

export function readPrintJob(jobId: string): { bodyHtml: string; title: string } | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(getPrintJobStorageKey(jobId))
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as { bodyHtml?: string; title?: string }
    if (typeof parsed.bodyHtml !== 'string' || typeof parsed.title !== 'string') {
      return null
    }

    return { bodyHtml: parsed.bodyHtml, title: parsed.title }
  } catch {
    return null
  }
}

export function readPrintJobFromWindowName(
  jobId: string,
): { bodyHtml: string; title: string } | null {
  if (typeof window === 'undefined' || typeof window.name !== 'string' || !window.name) {
    return null
  }

  try {
    const parsed = JSON.parse(window.name) as {
      bodyHtml?: string
      jobId?: string
      title?: string
      type?: string
    }

    if (
      parsed.type !== PRINT_JOB_WINDOW_NAME_PREFIX ||
      parsed.jobId !== jobId ||
      typeof parsed.bodyHtml !== 'string' ||
      typeof parsed.title !== 'string'
    ) {
      return null
    }

    window.name = ''
    return { bodyHtml: parsed.bodyHtml, title: parsed.title }
  } catch {
    return null
  }
}

export function useDocumentExport(options: UseDocumentExportOptions): UseDocumentExportReturn {
  const desktop = useDesktop()
  const router = useRouter()

  const canExportHtml = computed(() => typeof window !== 'undefined')
  const pdfExportSupport = computed(() =>
    getPdfExportSupport({
      isDesktop: desktop.value.isDesktop,
      isMobile: options.isMobile.value,
    }),
  )
  const canExportPdf = computed(
    () => typeof window !== 'undefined' && pdfExportSupport.value.isSupported,
  )
  const pdfExportUnavailableReason = computed(() => pdfExportSupport.value.unavailableReason)

  async function exportHtml(): Promise<void> {
    const rendered = await renderCurrentDocument()
    const documentHtml = buildMarkdownDocumentHtml(rendered)
    const suggestedPath = getSuggestedExportFileName(getDocumentPath(), 'html')

    if (desktop.value.isDesktop) {
      await desktop.value.exports.exportHtml({
        documentHtml,
        documentTitle: rendered.title,
        suggestedPath,
      })
      return
    }

    downloadFile(documentHtml, suggestedPath, 'text/html;charset=utf-8')
  }

  async function exportPdf(): Promise<void> {
    if (!canExportPdf.value) {
      throw new Error(pdfExportUnavailableReason.value || 'PDF export is not available.')
    }

    const rendered = await renderCurrentDocument()
    const documentHtml = buildMarkdownDocumentHtml(rendered)
    const suggestedPath = getSuggestedExportFileName(getDocumentPath(), 'pdf')

    if (desktop.value.isDesktop) {
      await desktop.value.exports.exportPdf({
        documentHtml,
        documentTitle: rendered.title,
        suggestedPath,
      })
      return
    }

    const printJobId = createPrintJobId()
    persistPrintJob(printJobId, rendered)

    const target = router.resolve({
      name: 'print-export',
      query: { job: printJobId },
    })

    const printWindow = window.open('', '_blank')
    if (printWindow === null) {
      cleanupPrintJob(printJobId)
      throw new Error('The print window could not be opened.')
    }

    printWindow.name = JSON.stringify({
      bodyHtml: rendered.bodyHtml,
      jobId: printJobId,
      title: rendered.title,
      type: PRINT_JOB_WINDOW_NAME_PREFIX,
    })
    printWindow.location.href = target.href
  }

  return {
    canExportHtml,
    canExportPdf,
    exportHtml,
    exportPdf,
    pdfExportUnavailableReason,
  }

  function getDocumentPath(): string {
    return options.currentPath.value ?? options.displayName.value
  }

  async function renderCurrentDocument() {
    return renderMarkdownDocument({
      content: options.content.value,
      title: getDefaultExportTitle(getDocumentPath()),
    })
  }
}

function createPrintJobId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const anchor = document.createElement('a')
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))

  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  revokeObjectUrlLater(url)
}

function getPrintJobStorageKey(jobId: string): string {
  return `${PRINT_JOB_KEY}${jobId}`
}

function persistPrintJob(jobId: string, payload: { bodyHtml: string; title: string }): void {
  const key = getPrintJobStorageKey(jobId)
  const value = JSON.stringify(payload)

  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const storageKey = window.localStorage.key(i)
          if (storageKey?.startsWith(PRINT_JOB_KEY)) {
            window.localStorage.removeItem(storageKey)
          }
        }
        window.localStorage.setItem(key, value)
      } catch {
        throw new Error('Unable to persist print job: storage quota exceeded.')
      }
    } else {
      throw error
    }
  }
}
