import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { isDesktopEnvironment } from '@/utils/platform'
import MarkdownExportPrintView from '@/views/MarkdownExportPrintView.vue'
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
    {
      component: MarkdownExportPrintView,
      name: 'print-export',
      path: '/export/print',
    },
  ],
})

export default router
