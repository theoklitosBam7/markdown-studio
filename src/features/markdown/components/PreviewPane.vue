<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'

import type { Theme } from '../types'

interface Props {
  html: string
  theme: Theme
  wordCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  renderDiagrams: [container: HTMLElement]
}>()

const previewRef = useTemplateRef<HTMLDivElement>('preview')
const renderKey = ref(0)

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(props.html, {
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    ADD_TAGS: ['iframe'],
  }),
)

async function refreshPreview(): Promise<void> {
  renderKey.value += 1
  await renderDiagrams()
}

async function renderDiagrams(): Promise<void> {
  await nextTick()
  if (previewRef.value) {
    emit('renderDiagrams', previewRef.value)
  }
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
</script>

<template>
  <div class="preview-pane">
    <div class="pane-header">
      <span class="pane-label">Preview</span>
      <span class="line-count">{{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}</span>
    </div>
    <div class="preview-scroll">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div :key="renderKey" ref="preview" class="rendered-md" v-html="sanitizedHtml"></div>
    </div>
  </div>
</template>

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
  max-width: 720px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  font-size: 15.5px;
  line-height: 1.8;
  color: var(--text);
}

.rendered-md :deep(h1),
.rendered-md :deep(h2),
.rendered-md :deep(h3),
.rendered-md :deep(h4),
.rendered-md :deep(h5),
.rendered-md :deep(h6) {
  font-family: 'Fraunces', serif;
  font-weight: 400;
  letter-spacing: -0.025em;
  color: var(--text);
  margin: 1.8em 0 0.5em;
  line-height: 1.25;
}

.rendered-md :deep(h1) {
  font-size: 2.2em;
}

.rendered-md :deep(h2) {
  font-size: 1.6em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3em;
}

.rendered-md :deep(h3) {
  font-size: 1.25em;
}

.rendered-md :deep(h4) {
  font-size: 1.05em;
  font-style: italic;
}

.rendered-md :deep(> *:first-child) {
  margin-top: 0;
}

.rendered-md :deep(p) {
  margin: 0.9em 0;
}

.rendered-md :deep(a) {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-color: var(--accent-mid);
}

.rendered-md :deep(strong) {
  font-weight: 500;
}

.rendered-md :deep(em) {
  font-family: 'Fraunces', serif;
  font-style: italic;
}

.rendered-md :deep(ul),
.rendered-md :deep(ol) {
  padding-left: 1.5em;
  margin: 0.7em 0;
}

.rendered-md :deep(li) {
  margin: 0.35em 0;
}

.rendered-md :deep(li > p) {
  margin: 0.2em 0;
}

.rendered-md :deep(blockquote) {
  margin: 1.2em 0;
  padding: 0.6em 1.2em;
  border-left: 3px solid var(--accent-mid);
  background: var(--accent-light);
  border-radius: 0 6px 6px 0;
  color: var(--text-muted);
}

.rendered-md :deep(blockquote p) {
  margin: 0;
}

.rendered-md :deep(code) {
  font-family: 'DM Mono', monospace;
  font-size: 0.85em;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1em 0.4em;
}

.rendered-md :deep(pre) {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  overflow-x: auto;
  margin: 1.2em 0;
}

.rendered-md :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  line-height: 1.65;
}

.rendered-md :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  font-size: 14px;
}

.rendered-md :deep(th) {
  background: var(--panel);
  font-weight: 500;
  text-align: left;
  padding: 8px 12px;
  border: 1px solid var(--border);
}

.rendered-md :deep(td) {
  padding: 7px 12px;
  border: 1px solid var(--border);
}

.rendered-md :deep(tr:nth-child(even) td) {
  background: var(--bg);
}

.rendered-md :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2em 0;
}

.rendered-md :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.rendered-md :deep(.mermaid-wrap) {
  margin: 1.4em 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.rendered-md :deep(.mermaid-wrap svg) {
  max-width: 100%;
  height: auto;
}

.rendered-md :deep(.mermaid-error) {
  color: #c0392b;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  padding: 12px;
  background: #fdf0ef;
  border: 1px solid #f5c6c6;
  border-radius: 8px;
}

@media (max-width: 700px) {
  .line-count {
    display: none;
  }

  .preview-scroll {
    padding: 20px var(--app-gutter) 32px;
  }

  .rendered-md {
    font-size: 15px;
    line-height: 1.7;
  }

  .rendered-md :deep(h1) {
    font-size: 1.9em;
  }

  .rendered-md :deep(h2) {
    font-size: 1.45em;
  }

  .rendered-md :deep(pre) {
    padding: 14px 16px;
  }
}
</style>
