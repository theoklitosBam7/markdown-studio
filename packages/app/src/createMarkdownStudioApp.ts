import { createPinia } from 'pinia'
import { createApp, type App as VueApp } from 'vue'

import App from '@/App.vue'
import router from '@/router'

export function createMarkdownStudioApp(): VueApp {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  return app
}
