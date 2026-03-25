import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { isDesktopEnvironment } from '@/utils/platform'
import MarkdownStudioView from '@/views/MarkdownStudioView.vue'

const router = createRouter({
  history: isDesktopEnvironment()
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: MarkdownStudioView,
      name: 'home',
      path: '/',
    },
  ],
})

export default router
