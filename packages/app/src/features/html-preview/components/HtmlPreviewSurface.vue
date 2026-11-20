<script setup lang="ts">
import { computed } from 'vue'

import { useHtmlPreviewAssets } from '../composables/useHtmlPreviewAssets'
import { prepareHtmlPreview } from '../utils/prepareHtmlPreview'
import HtmlPreviewFrame from './HtmlPreviewFrame.vue'

const props = defineProps<{
  content: string
  documentPath?: null | string
}>()

const { assetBaseUrl, error } = useHtmlPreviewAssets(() => props.documentPath)

const preview = computed(() =>
  prepareHtmlPreview({
    allowScripts: false,
    assetBaseUrl: assetBaseUrl.value,
    content: props.content,
  }),
)
const notice = computed(
  () =>
    error.value ??
    "Read-only preview. Scripts and forms are blocked. Local assets in the HTML Document's folder load on desktop.",
)
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

.html-preview :deep(.html-preview-frame) {
  flex: 1;
}
</style>
