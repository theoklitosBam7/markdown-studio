export interface HtmlPreviewRequest {
  allowScripts: boolean
  assetBaseUrl?: string
  content: string
}

export type HtmlPreviewSandbox = '' | 'allow-scripts'

export interface PreparedHtmlPreview {
  sandbox: HtmlPreviewSandbox
  srcdoc: string
}
