<script setup lang="ts">
import type { PreparedHtmlPreview } from '../types'

defineProps<{
  preview: PreparedHtmlPreview
}>()
</script>

<template>
  <iframe
    :key="preview.sandbox"
    class="html-preview-frame"
    title="HTML preview"
    :sandbox="preview.sandbox"
    :srcdoc="preview.srcdoc"
  ></iframe>
</template>

<style scoped>
.html-preview-frame {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  background: var(--surface);
}
</style>
