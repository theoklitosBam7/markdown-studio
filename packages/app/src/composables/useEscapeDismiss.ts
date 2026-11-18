import { onMounted, onUnmounted, type Ref } from 'vue'

export function useEscapeDismiss(isOpen: Readonly<Ref<boolean>>, dismiss: () => void): void {
  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen.value || event.key !== 'Escape' || event.defaultPrevented) return

    event.preventDefault()
    event.stopPropagation()
    dismiss()
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
