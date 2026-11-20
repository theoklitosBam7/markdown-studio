<script setup lang="ts">
import { computed } from 'vue'

import { prepareHtmlPreview } from '../utils/prepareHtmlPreview'
import HtmlPreviewFrame from './HtmlPreviewFrame.vue'

const props = defineProps<{
  content: string
}>()

const preview = computed(() =>
  prepareHtmlPreview({
    allowScripts: false,
    content: props.content,
  }),
)
</script>

<template>
  <section class="html-preview" aria-label="HTML preview">
    <p class="html-preview__notice">
      Read-only preview. Scripts, forms, and external assets are blocked.
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

.html-preview :deep(.html-preview-frame) {
  flex: 1;
}
</style>
