<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'
import { isSafeExternalUrl } from '@/utils/platform'

import type { MarkdownSourceMapEntry, Theme } from '../types'

interface Props {
  html: string
  sourceMap: MarkdownSourceMapEntry[]
  theme: Theme
  wordCount: number
}

const props = defineProps<Props>()
const desktop = useDesktop()

const emit = defineEmits<{
  jumpToOffset: [offset: number]
  renderDiagrams: [container: HTMLElement]
}>()

const previewRef = useTemplateRef<HTMLDivElement>('preview')
const previewScrollRef = useTemplateRef<HTMLDivElement>('previewScroll')
const renderKey = ref(0)

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(props.html, {
    ADD_ATTR: ['data-source-end', 'data-source-id', 'data-source-start', 'id'],
    FORBID_ATTR: desktop.value.isDesktop
      ? ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      : [],
    FORBID_TAGS: desktop.value.isDesktop ? ['iframe'] : [],
  }),
)

function getAnchorTop(element: HTMLElement, scrollContainer: HTMLDivElement): number {
  const elementRect = element.getBoundingClientRect()
  const containerRect = scrollContainer.getBoundingClientRect()

  return elementRect.top - containerRect.top + scrollContainer.scrollTop
}

function getSourceElement(entry: MarkdownSourceMapEntry): HTMLElement | null {
  if (!previewRef.value) return null

  return (
    previewRef.value.querySelector<HTMLElement>(`[data-source-id="${entry.id}"]`) ??
    previewRef.value.querySelector<HTMLElement>(`#markdown-source-${entry.id}`)
  )
}

function handleDoubleClick(event: MouseEvent): void {
  const target = event.target
  const sourceElement =
    target instanceof Element
      ? target.closest<HTMLElement>('[data-source-start]')
      : target instanceof Node
        ? target.parentElement?.closest<HTMLElement>('[data-source-start]')
        : null

  const sourceStart = sourceElement?.dataset.sourceStart
  if (sourceStart === undefined) return

  emit('jumpToOffset', Number.parseInt(sourceStart, 10))
}

function handleLinkClick(event: MouseEvent): void {
  if (!desktop.value.isDesktop) return

  const target = event.target
  const link =
    target instanceof Element
      ? target.closest<HTMLAnchorElement>('a[href]')
      : target instanceof Node
        ? target.parentElement?.closest<HTMLAnchorElement>('a[href]')
        : null

  const href = link?.href
  if (!href || !isSafeExternalUrl(href)) return

  event.preventDefault()
  void desktop.value.shell.openExternal(href)
}

function hydrateSourceAnchors(): void {
  const candidateElements = previewRef.value?.querySelectorAll<HTMLElement>(
    'h1, h2, h3, h4, h5, h6, p, blockquote, li, table, pre, hr, .mermaid-wrap, .html-block',
  )
  if (!candidateElements) return

  let candidateIndex = 0

  for (const entry of props.sourceMap) {
    let element: HTMLElement | null = getSourceElement(entry)

    while (!element && candidateIndex < candidateElements.length) {
      const candidate = candidateElements[candidateIndex]!
      candidateIndex += 1

      if (isMatchingElement(entry, candidate)) {
        element = candidate
      }
    }

    if (!element) {
      continue
    }

    element.dataset.sourceEnd = String(entry.end)
    element.dataset.sourceId = entry.id
    element.dataset.sourceStart = String(entry.start)
    element.id = `markdown-source-${entry.id}`
  }
}

function isMatchingElement(entry: MarkdownSourceMapEntry, element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false

  if (entry.type === 'heading') {
    return /^H[1-6]$/.test(element.tagName)
  }

  if (entry.type === 'paragraph') {
    return element.tagName === 'P'
  }

  if (entry.type === 'blockquote') {
    return element.tagName === 'BLOCKQUOTE'
  }

  if (entry.type === 'list_item') {
    return element.tagName === 'LI'
  }

  if (entry.type === 'table') {
    return element.tagName === 'TABLE'
  }

  if (entry.type === 'code') {
    return element.tagName === 'PRE' || element.classList.contains('mermaid-wrap')
  }

  if (entry.type === 'hr') {
    return element.tagName === 'HR'
  }

  if (entry.type === 'html') {
    return element.classList.contains('html-block')
  }

  return false
}

async function refreshPreview(): Promise<void> {
  renderKey.value += 1
  await renderDiagrams()
}

async function renderDiagrams(): Promise<void> {
  await nextTick()
  hydrateSourceAnchors()
  if (previewRef.value) {
    emit('renderDiagrams', previewRef.value)
  }
}

function scrollToSourceOffset(offset: number): void {
  const scrollContainer = previewScrollRef.value
  if (!scrollContainer) return

  const anchors = props.sourceMap
    .map((entry) => {
      const element = getSourceElement(entry)
      if (!element) return null

      return {
        ...entry,
        top: getAnchorTop(element, scrollContainer),
      }
    })
    .filter((entry): entry is { top: number } & MarkdownSourceMapEntry => entry !== null)

  if (anchors.length === 0) return

  let targetTop = anchors[anchors.length - 1]?.top ?? 0

  if (offset <= anchors[0]!.start) {
    targetTop = anchors[0]!.top
  } else {
    for (let index = 0; index < anchors.length - 1; index += 1) {
      const current = anchors[index]!
      const next = anchors[index + 1]!

      if (offset >= current.start && offset <= next.start) {
        const span = next.start - current.start
        const ratio = span > 0 ? (offset - current.start) / span : 0
        targetTop = current.top + (next.top - current.top) * ratio
        break
      }
    }
  }

  const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight)
  scrollContainer.scrollTop = Math.min(Math.max(targetTop, 0), maxScrollTop)
}

onMounted(() => {
  void renderDiagrams()
})

// Watch for HTML or theme changes and trigger mermaid rendering.
watch(
  () => [props.html, props.theme],
  async () => {
    await refreshPreview()
  },
)

defineExpose({ scrollToSourceOffset })
</script>

<template>
  <div class="preview-pane">
    <div class="pane-header">
      <span class="pane-label">Preview</span>
      <span class="line-count">{{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}</span>
    </div>
    <div ref="previewScroll" class="preview-scroll">
      <!-- eslint-disable vue/no-v-html -->
      <div
        :key="renderKey"
        ref="preview"
        class="rendered-md markdown-document markdown-document-theme--app"
        @click="handleLinkClick"
        @dblclick="handleDoubleClick"
        v-html="sanitizedHtml"
      ></div>
    </div>
  </div>
</template>

<style>
@import '../styles/markdown-document.css';
</style>

<style scoped>
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane-header {
  height: var(--pane-header-h);
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 var(--app-gutter);
  gap: 8px;
  flex-shrink: 0;
}

.pane-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.line-count {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
}

.preview-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 36px 48px;
  background: var(--surface);
}

.rendered-md {
  min-height: 100%;
}

@media (max-width: 700px) {
  .line-count {
    display: none;
  }

  .preview-scroll {
    padding: 20px var(--app-gutter) 32px;
  }
}
</style>
