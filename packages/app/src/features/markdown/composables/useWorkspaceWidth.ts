import { onMounted, onUnmounted, readonly, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

export function useWorkspaceWidth(element: Readonly<ShallowRef<HTMLElement | null>>) {
  const width = shallowRef(0)
  let observer: ResizeObserver | undefined

  onMounted(() => {
    const container = element.value
    if (!container) return

    const measure = () => {
      width.value = container.getBoundingClientRect().width
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver(measure)
    observer.observe(container)
  })

  onUnmounted(() => observer?.disconnect())

  return readonly(width)
}
