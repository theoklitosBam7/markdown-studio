import { createRouter, createWebHistory } from 'vue-router'

import MarkdownStudioView from '@/views/MarkdownStudioView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: MarkdownStudioView,
      name: 'home',
      path: '/',
    },
  ],
})

export default router
