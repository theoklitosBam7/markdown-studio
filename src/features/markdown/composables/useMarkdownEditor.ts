import type { ComputedRef, DeepReadonly, ShallowRef } from 'vue'

import { marked, type Tokens } from 'marked'
import mermaid from 'mermaid'
import { computed, onUnmounted, readonly, shallowRef, watch } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { escapeHtml } from '@/utils/escapeHtml'

import type { EditorStats, Example, Theme, ViewMode } from '../types'

import { DEFAULT_EXAMPLE_INDEX, EXAMPLES } from './examples'

interface UseMarkdownEditorOptions {
  initialContent?: string
  initialViewMode?: ViewMode
}

interface UseMarkdownEditorReturn {
  clearContent: () => void
  content: DeepReadonly<ShallowRef<string>>
  copyContent: () => Promise<void>
  isCopied: DeepReadonly<ShallowRef<boolean>>
  loadExample: (example: Example) => void
  renderedHtml: ComputedRef<string>
  renderMermaidDiagrams: (container: HTMLElement) => Promise<void>
  setTheme: (theme: Theme) => void
  setViewMode: (mode: ViewMode) => void
  stats: ComputedRef<EditorStats>
  theme: DeepReadonly<ShallowRef<Theme>>
  toggleTheme: () => void
  updateContent: (value: string) => void
  viewMode: DeepReadonly<ShallowRef<ViewMode>>
}

export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}): UseMarkdownEditorReturn {
  // Use global theme composable for persistence
  const { setTheme, theme, toggleTheme } = useTheme()

  function configureMermaid(activeTheme: Theme): void {
    mermaid.initialize({
      fontFamily: 'DM Sans, sans-serif',
      securityLevel: 'strict',
      startOnLoad: false,
      theme: activeTheme === 'dark' ? 'dark' : 'neutral',
    })
  }

  // Initialize Mermaid with the current theme and keep it in sync for future renders.
  configureMermaid(theme.value)

  // State
  const defaultExample = EXAMPLES[DEFAULT_EXAMPLE_INDEX]
  const _content = shallowRef(
    options.initialContent ?? (defaultExample ? defaultExample.content.trim() : ''),
  )
  const _viewMode = shallowRef<ViewMode>(options.initialViewMode ?? 'split')
  const _isCopied = shallowRef(false)
  let copyTimeout: ReturnType<typeof setTimeout> | undefined

  onUnmounted(() => {
    if (copyTimeout !== undefined) {
      clearTimeout(copyTimeout)
      copyTimeout = undefined
    }
  })

  // Setup marked renderer to intercept mermaid code blocks
  const renderer = new marked.Renderer()
  renderer.code = function (token: Tokens.Code): string {
    if (token.lang === 'mermaid') {
      const source = escapeHtml(token.text)
      return `<div class="mermaid-wrap"><div class="mermaid">${source}</div></div>`
    }
    return `<pre><code class="${escapeHtml(token.lang || '')}">${escapeHtml(token.text)}</code></pre>`
  }

  marked.setOptions({ breaks: false, gfm: true, renderer })

  // Computed
  const renderedHtml = computed(() => marked.parse(_content.value) as string)

  const stats = computed<EditorStats>(() => {
    const text = _content.value
    const lines = text.split('\n').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    // Count mermaid diagrams
    const mermaidMatches = text.match(/```mermaid[\s\S]*?```/g)
    const diagrams = mermaidMatches ? mermaidMatches.length : 0

    return { chars, diagrams, lines, words }
  })

  // Watchers - re-initialize mermaid when theme changes
  watch(theme, (newTheme) => {
    configureMermaid(newTheme)
  })

  // Actions
  function setViewMode(mode: ViewMode): void {
    _viewMode.value = mode
  }

  function updateContent(value: string): void {
    _content.value = value
  }

  function clearContent(): void {
    if (_content.value && !confirm('Clear the editor?')) return
    _content.value = ''
  }

  async function copyContent(): Promise<void> {
    try {
      await navigator.clipboard.writeText(_content.value)
      _isCopied.value = true
      if (copyTimeout !== undefined) {
        clearTimeout(copyTimeout)
      }
      copyTimeout = setTimeout(() => {
        _isCopied.value = false
        copyTimeout = undefined
      }, 1500)
    } catch (e) {
      console.error('Failed to copy to clipboard:', e)
    }
  }

  function loadExample(example: Example): void {
    _content.value = example.content.trim()
  }

  async function renderMermaidDiagrams(container: HTMLElement): Promise<void> {
    configureMermaid(theme.value)

    const diagrams = container.querySelectorAll('.mermaid')

    for (const el of diagrams) {
      const code = el.textContent?.trim() ?? ''
      const id = 'mmd-render-' + crypto.randomUUID()
      try {
        const { svg } = await mermaid.render(id, code)
        const wrap = el.closest('.mermaid-wrap')
        if (wrap) wrap.innerHTML = svg
      } catch (e) {
        const wrap = el.closest('.mermaid-wrap')
        if (wrap) {
          wrap.innerHTML = `<div class="mermaid-error">⚠ Mermaid error: ${escapeHtml(e instanceof Error ? e.message : String(e))}</div>`
        }
      }
    }
  }

  return {
    clearContent,
    content: readonly(_content),
    copyContent,
    isCopied: readonly(_isCopied),
    loadExample,
    renderedHtml,
    renderMermaidDiagrams,
    setTheme,
    setViewMode,
    stats,
    theme,
    toggleTheme,
    updateContent,
    viewMode: readonly(_viewMode),
  }
}
