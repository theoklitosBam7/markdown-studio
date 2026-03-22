<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

interface Props {
  content: string
  lineCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:content': [value: string]
}>()

const editorRef = useTemplateRef<HTMLTextAreaElement>('editor')

// Use computed for v-model to avoid direct prop mutation
const localContent = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value),
})

// Expose focus method
function focus(): void {
  editorRef.value?.focus()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab') {
    event.preventDefault()
    const editor = editorRef.value
    if (!editor) return

    const start = editor.selectionStart
    const end = editor.selectionEnd
    const newValue = editor.value.slice(0, start) + '  ' + editor.value.slice(end)
    localContent.value = newValue
    // Set cursor position after update
    setTimeout(() => {
      editor.selectionStart = editor.selectionEnd = start + 2
    }, 0)
  }
}

defineExpose({ focus })
</script>

<template>
  <div class="editor-pane">
    <div class="pane-header">
      <span class="pane-label">Markdown</span>
      <span class="line-count">{{ lineCount }} line{{ lineCount !== 1 ? 's' : '' }}</span>
    </div>
    <textarea
      ref="editor"
      v-model="localContent"
      class="editor"
      spellcheck="false"
      placeholder="Write your markdown here...&#10;&#10;```mermaid&#10;graph LR&#10;  A --> B&#10;```"
      @keydown="handleKeydown"
    ></textarea>
  </div>
</template>

<style scoped>
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  min-width: 0;
}

.pane-header {
  height: 36px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  flex-shrink: 0;
}

.pane-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.line-count {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
}

.editor {
  flex: 1;
  width: 100%;
  background: var(--surface);
  color: var(--text);
  border: none;
  outline: none;
  resize: none;
  padding: 24px;
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  line-height: 1.7;
  tab-size: 2;
}
</style>
