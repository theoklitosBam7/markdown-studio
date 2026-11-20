import type { DesktopHtmlPreviewAssetGrantResult } from '@markdown-studio/desktop-contract/types'
import type { ShallowRef } from 'vue'

import { onScopeDispose, shallowRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'

type DocumentPathSource = () => null | string | undefined

interface HtmlPreviewAssets {
  assetBaseUrl: ShallowRef<string | undefined>
  error: ShallowRef<null | string>
}

const ASSET_ERROR_MESSAGE = 'Local assets could not be prepared for this preview.'

export function useHtmlPreviewAssets(documentPath: DocumentPathSource): HtmlPreviewAssets {
  const desktop = useDesktop()
  const assetBaseUrl = shallowRef<string>()
  const error = shallowRef<null | string>(null)
  let activeGrant: DesktopHtmlPreviewAssetGrantResult | null = null
  let requestGeneration = 0

  watch(
    documentPath,
    (path) => {
      releaseGrant(true)
      error.value = null

      if (!path) return

      const api = desktop.value.htmlPreview
      if (!desktop.value.isDesktop || !api) return

      void requestGrant(api, path)
    },
    { immediate: true },
  )

  onScopeDispose(() => releaseGrant(false))

  return { assetBaseUrl, error }

  function releaseGrant(reportFailure: boolean): void {
    requestGeneration += 1
    const api = desktop.value.htmlPreview
    const grantId = activeGrant?.grantId

    activeGrant = null
    assetBaseUrl.value = undefined
    if (!api || !grantId) return

    void api.releaseAssetGrant(grantId).catch(() => {
      if (reportFailure) error.value = ASSET_ERROR_MESSAGE
    })
  }

  async function requestGrant(
    api: NonNullable<typeof desktop.value.htmlPreview>,
    path: string,
  ): Promise<void> {
    const generation = requestGeneration

    try {
      const grant = await api.requestAssetGrant({ documentPath: path })

      if (generation !== requestGeneration) {
        await api.releaseAssetGrant(grant.grantId)
        return
      }

      error.value = null
      activeGrant = grant
      assetBaseUrl.value = grant.assetBaseUrl
    } catch {
      error.value = ASSET_ERROR_MESSAGE
    }
  }
}
