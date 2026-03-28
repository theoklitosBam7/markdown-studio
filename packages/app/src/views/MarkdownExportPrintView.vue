<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

import {
  cleanupPrintJob,
  readPrintJob,
  readPrintJobFromWindowName,
} from '@/features/markdown/composables/useDocumentExport'

const route = useRoute()
const printRef = useTemplateRef<HTMLElement>('printRoot')
const bodyHtml = shallowRef('')
const title = shallowRef('Markdown Export')
const errorMessage = shallowRef('')

const jobId = typeof route.query.job === 'string' ? route.query.job : null
let cleanedUp = false

onMounted(async () => {
  if (!jobId) {
    errorMessage.value = 'The export job is missing.'
    return
  }

  const payload = readPrintJob(jobId) ?? readPrintJobFromWindowName(jobId)
  if (!payload) {
    errorMessage.value = 'The export job is no longer available.'
    return
  }

  bodyHtml.value = payload.bodyHtml
  title.value = payload.title
  document.title = `${payload.title} - Print`

  const handleAfterPrint = () => {
    cleanup()
    window.close()
  }

  window.addEventListener('afterprint', handleAfterPrint, { once: true })

  await nextTick()
  await nextTick()

  if (printRef.value) {
    await waitForImages(printRef.value)
  }

  window.print()
})

onBeforeUnmount(() => {
  cleanup()
})

function cleanup(): void {
  if (!jobId || cleanedUp) return

  cleanupPrintJob(jobId)
  cleanedUp = true
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  const pending = images.filter((image) => !image.complete)

  if (pending.length === 0) {
    return Promise.resolve()
  }

  await Promise.race([
    Promise.all(
      pending.map(
        (image_1) =>
          new Promise<void>((resolve) => {
            const done = () => resolve()
            image_1.addEventListener('error', done, { once: true })
            image_1.addEventListener('load', done, { once: true })
          }),
      ),
    ),
    new Promise<void>((resolve_1) => {
      window.setTimeout(resolve_1, 5000)
    }),
  ])
  return undefined
}
</script>

<template>
  <main class="print-view markdown-document-theme--light">
    <article v-if="!errorMessage" ref="printRoot" class="print-view__document markdown-document">
      <!-- eslint-disable vue/no-v-html -->
      <div v-html="bodyHtml"></div>
    </article>
    <section v-else class="print-view__error">
      <h1 class="print-view__title">{{ title }}</h1>
      <p>{{ errorMessage }}</p>
    </section>
  </main>
</template>

<style>
@import '@/features/markdown/styles/markdown-document.css';
</style>

<style scoped>
.print-view {
  min-height: 100vh;
  background: #f7f5f0;
  padding: 32px 24px 56px;
}

.print-view__document {
  background: #ffffff;
  border: 1px solid #e2ddd5;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(26, 24, 20, 0.08);
  padding: 48px 56px;
}

.print-view__error {
  max-width: 640px;
  margin: 64px auto 0;
  border: 1px solid #e2ddd5;
  border-radius: 18px;
  background: #ffffff;
  padding: 32px;
  color: #1a1814;
  font-family: 'DM Sans', sans-serif;
}

.print-view__title {
  margin-bottom: 12px;
  font-family: 'Fraunces', serif;
  font-weight: 400;
}

@media print {
  .print-view {
    padding: 0;
    background: #ffffff;
  }

  .print-view__document,
  .print-view__error {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
}
</style>
