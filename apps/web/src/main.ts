import { createMarkdownStudioApp, registerPwaServiceWorker } from '@markdown-studio/app'
import { registerSW } from 'virtual:pwa-register'

if (import.meta.env.VITE_DISABLE_PWA !== 'true') {
  registerPwaServiceWorker({
    register: registerSW,
  })
}

createMarkdownStudioApp().mount('#app')
