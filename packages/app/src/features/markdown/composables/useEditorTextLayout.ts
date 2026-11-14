import { onMounted, onUnmounted, type Ref, shallowRef, watch } from 'vue'

import { EDITOR_FONT_FLOOR_MEDIA_QUERY } from '../types/editorDisplayPreferences'

interface EditorTextLayoutOptions {
  content: () => string
  editor: Readonly<Ref<HTMLTextAreaElement | null>>
  layout: () => unknown
  mirror: () => HTMLElement | null
}

interface SourceLineBounds {
  end: number
  height: number
  start: number
  top: number
}

/** Owns browser measurements of the same text mirror that draws Find matches. */
export function useEditorTextLayout(options: EditorTextLayoutOptions) {
  const lines = shallowRef<SourceLineBounds[]>([])
  const fontFloorMedia =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(EDITOR_FONT_FLOOR_MEDIA_QUERY)
      : null
  let resizeObserver: null | ResizeObserver = null
  let frame: null | number = null
  let viewportAnchor: { offset: number; scrollTop: number; viewportTop: number } | null = null

  function measure(): void {
    const mirror = options.mirror()
    if (!mirror) return

    const origin = mirror.getBoundingClientRect()
    let start = 0
    lines.value = Array.from(mirror.children, (element) => {
      const bounds = element.getBoundingClientRect()
      const end = start + (element.textContent?.length ?? 0)
      const line = { end, height: bounds.height, start, top: bounds.top - origin.top }
      start = end + 1
      return line
    })
    if (viewportAnchor && options.editor.value) {
      const bounds = getOffsetBounds(viewportAnchor.offset)
      const nextScrollTop = Math.max(0, bounds.top - viewportAnchor.viewportTop)
      options.editor.value.scrollTop = nextScrollTop
    }
    rememberViewport()
  }

  function scheduleMeasurement(): void {
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      measure()
    })
  }

  function refresh(): void {
    if (frame === null) return
    cancelAnimationFrame(frame)
    frame = null
    measure()
  }

  function getLineAtOffset(offset: number): SourceLineBounds | undefined {
    let low = 0
    let high = lines.value.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      const line = lines.value[middle]
      if (line && offset > line.end) low = middle + 1
      else high = middle
    }
    return lines.value[low]
  }

  function getOffsetBounds(offset: number): { left: number; top: number } {
    const line = getLineAtOffset(offset)
    const mirror = options.mirror()
    if (!line || !mirror) return { left: 0, top: 0 }

    const fallback = { left: 0, top: line.top }
    const element = mirror.children.item(lines.value.indexOf(line))
    if (!element) return fallback

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let remaining = Math.max(0, offset - line.start)
    let node = walker.nextNode()
    while (node) {
      const length = node.textContent?.length ?? 0
      if (remaining < length || (length > 0 && offset === line.end && remaining === length)) {
        const range = document.createRange()
        range.setStart(node, Math.min(remaining, length))
        range.setEnd(node, Math.min(remaining + 1, length))
        const bounds = range.getBoundingClientRect()
        const origin = mirror.getBoundingClientRect()
        return { left: bounds.left - origin.left, top: bounds.top - origin.top }
      }
      remaining -= length
      node = walker.nextNode()
    }
    return fallback
  }

  function getFirstVisibleSourceOffset(scrollTop: number): number {
    let low = 0
    let high = lines.value.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      const line = lines.value[middle]
      if (line && line.top + line.height <= scrollTop) low = middle + 1
      else high = middle
    }
    return lines.value[low]?.start ?? 0
  }

  function rememberViewport(force = false): void {
    const editor = options.editor.value
    if (!editor || (frame !== null && !force)) return

    const line = getLineAtOffset(getFirstVisibleSourceOffset(editor.scrollTop))
    if (!line) return

    // Find one visible source position without measuring every character or line.
    let low = line.start
    let high = line.end
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (getOffsetBounds(middle).top <= editor.scrollTop) low = middle
      else high = middle - 1
    }
    viewportAnchor = {
      offset: low,
      scrollTop: editor.scrollTop,
      viewportTop: getOffsetBounds(low).top - editor.scrollTop,
    }
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && options.editor.value) {
      resizeObserver = new ResizeObserver(scheduleMeasurement)
      resizeObserver.observe(options.editor.value)
    }
    window.addEventListener('resize', scheduleMeasurement)
    document.fonts?.addEventListener('loadingdone', scheduleMeasurement)
    fontFloorMedia?.addEventListener('change', scheduleMeasurement)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    if (frame !== null) cancelAnimationFrame(frame)
    window.removeEventListener('resize', scheduleMeasurement)
    document.fonts?.removeEventListener('loadingdone', scheduleMeasurement)
    fontFloorMedia?.removeEventListener('change', scheduleMeasurement)
  })

  watch(
    options.content,
    () => {
      // Typing and document replacement keep the textarea's native scroll behavior.
      viewportAnchor = null
      scheduleMeasurement()
    },
    { flush: 'post' },
  )
  watch(options.layout, () => {
    const editor = options.editor.value
    if (editor && viewportAnchor?.scrollTop !== editor.scrollTop) rememberViewport(true)
    scheduleMeasurement()
  })

  return {
    getFirstVisibleSourceOffset,
    getLineAtOffset,
    getOffsetBounds,
    lines,
    refresh,
    rememberViewport,
  }
}
