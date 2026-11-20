export interface HtmlPreviewRequest {
  allowScripts: boolean
  content: string
}

export type HtmlPreviewSandbox = '' | 'allow-scripts'

export interface PreparedHtmlPreview {
  sandbox: HtmlPreviewSandbox
  srcdoc: string
}
