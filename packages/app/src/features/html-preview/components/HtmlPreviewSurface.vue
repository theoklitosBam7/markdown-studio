<script setup lang="ts">
import type {
  DesktopHtmlPreviewApi,
  DesktopHtmlPreviewAssetGrantResult,
} from '@markdown-studio/desktop-contract/types'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'
import { prepareHtmlPreview } from '../utils/prepareHtmlPreview'
import HtmlPreviewFrame from './HtmlPreviewFrame.vue'

const props = defineProps<{
  content: string
  documentPath?: null | string
}>()

const desktop = useDesktop()
const assetBaseUrl = shallowRef<string>()
let activeGrant: DesktopHtmlPreviewAssetGrantResult | null = null
let requestGeneration = 0

const preview = computed(() =>
  prepareHtmlPreview({
    allowScripts: false,
    assetBaseUrl: assetBaseUrl.value,
    content: props.content,
  }),
)

watch(
  () => props.documentPath,
  (documentPath) => {
    releaseGrant()
    if (!documentPath) return

    const api = desktop.value.htmlPreview
    if (!desktop.value.isDesktop || !api) return

    void requestGrant(api, documentPath)
  },
  { immediate: true },
)

onBeforeUnmount(releaseGrant)

function releaseGrant(): void {
  requestGeneration += 1
  const api = desktop.value.htmlPreview
  const grantId = activeGrant?.grantId

  activeGrant = null
  assetBaseUrl.value = undefined

  if (!api || !grantId) return

  void releaseGrantId(api, grantId)
}

async function releaseGrantId(api: DesktopHtmlPreviewApi, grantId: string): Promise<void> {
  try {
    await api.releaseAssetGrant(grantId)
  } catch (error) {
    console.error('Failed to release HTML preview assets:', error)
  }
}

async function requestGrant(api: DesktopHtmlPreviewApi, documentPath: string): Promise<void> {
  const generation = requestGeneration

  try {
    const grant = await api.requestAssetGrant({ documentPath })

    if (generation !== requestGeneration) {
      await releaseGrantId(api, grant.grantId)
      return
    }

    activeGrant = grant
    assetBaseUrl.value = grant.assetBaseUrl
  } catch (error) {
    console.error('Failed to request HTML preview assets:', error)
  }
}
</script>

<template>
  <section class="html-preview" aria-label="HTML preview">
    <p class="html-preview__notice">
      Read-only preview. Scripts and forms are blocked. Local assets in the HTML Document's folder
      load on desktop.
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
