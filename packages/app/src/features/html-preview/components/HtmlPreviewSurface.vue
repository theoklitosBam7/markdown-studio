<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'

import { useHtmlPreviewAssets } from '../composables/useHtmlPreviewAssets'
import { prepareHtmlPreview } from '../utils/prepareHtmlPreview'
import HtmlPreviewFrame from './HtmlPreviewFrame.vue'

const props = defineProps<{
  content: string
  documentPath?: null | string
}>()

const desktop = useDesktop()
const { assetBaseUrl, error } = useHtmlPreviewAssets(() => props.documentPath)
const allowScripts = shallowRef(false)

watch([() => props.documentPath, () => props.content], () => {
  allowScripts.value = false
})

const canEnableScripts = computed(() => desktop.value.isDesktop)
const scriptsEnabled = computed(() => canEnableScripts.value && allowScripts.value)
const preview = computed(() =>
  prepareHtmlPreview({
    allowScripts: scriptsEnabled.value,
    assetBaseUrl: assetBaseUrl.value,
    content: props.content,
  }),
)
const notice = computed(() => {
  if (error.value) return error.value
  if (scriptsEnabled.value) {
    return 'Read-only preview. Local inline scripts can run. CDN scripts, network APIs, and parent DOM access stay blocked.'
  }

  return "Read-only preview. Scripts and forms are blocked. Local assets in the HTML Document's folder load on desktop."
})
</script>

<template>
  <section class="html-preview" aria-label="HTML preview">
    <p
      class="html-preview__notice"
      :class="{ 'html-preview__notice--error': error }"
      :role="error ? 'alert' : undefined"
    >
      {{ notice }}
    </p>
    <div v-if="canEnableScripts" class="html-preview__controls">
      <button
        class="html-preview__scripts-toggle"
        type="button"
        :aria-pressed="allowScripts"
        @click="allowScripts = !allowScripts"
      >
        {{ allowScripts ? 'Disable scripts for this preview' : 'Enable scripts for this preview' }}
      </button>
      <p v-if="allowScripts" class="html-preview__scripts-status" role="status">
        Scripts enabled for this preview
      </p>
    </div>
    <HtmlPreviewFrame :preview="preview" />
  </section>
</template>

<style scoped>
.html-preview {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--surface);
}

.html-preview__notice {
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: var(--font-size-ui-caption);
}

.html-preview__notice--error {
  color: var(--destructive);
}

.html-preview__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
}

.html-preview__scripts-toggle {
  padding: 4px 10px;
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-ui-caption);
}

.html-preview__scripts-toggle:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.html-preview__scripts-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.html-preview__scripts-status {
  margin: 0;
  color: var(--brass);
  font-size: var(--font-size-ui-caption);
  font-weight: 600;
}

.html-preview :deep(.html-preview-frame) {
  flex: 1;
}
</style>
