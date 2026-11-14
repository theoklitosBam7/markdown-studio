<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

import EditorDisplayNumberInput from './EditorDisplayNumberInput.vue'
import {
  DEFAULT_EDITOR_DISPLAY_PREFERENCES,
  EDITOR_DISPLAY_PREFERENCE_LIMITS,
  EDITOR_FONT_FLOOR_MEDIA_QUERY,
  type EditorDisplayNumericPreference,
  type EditorDisplayPreferences,
  type EditorDisplayPreferencesUpdate,
  isValidEditorDisplayNumber,
} from '../types/editorDisplayPreferences'

type NumericField = Exclude<EditorDisplayNumericPreference, 'writingColumnCharacters'>

const props = defineProps<{
  isMobile: boolean
  isOpen: boolean
  persistenceError: null | string
  preferences: Readonly<EditorDisplayPreferences>
  returnFocus: HTMLElement | null
}>()
const emit = defineEmits<{
  close: []
  reset: []
  retry: []
  update: [patch: EditorDisplayPreferencesUpdate]
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const writingColumnCharacters = computed(() => {
  if (props.preferences.writingColumn.kind === 'characters') {
    return props.preferences.writingColumn.characters
  }
  if (DEFAULT_EDITOR_DISPLAY_PREFERENCES.writingColumn.kind === 'characters') {
    return DEFAULT_EDITOR_DISPLAY_PREFERENCES.writingColumn.characters
  }
  return 80
})
const drafts = shallowRef<Record<EditorDisplayNumericPreference, string>>({
  fontSizePx: String(props.preferences.fontSizePx),
  lineHeight: String(props.preferences.lineHeight),
  tabWidth: String(props.preferences.tabWidth),
  writingColumnCharacters: String(writingColumnCharacters.value),
})
const errors = shallowRef<Partial<Record<EditorDisplayNumericPreference, string>>>({})
const fontFloorMedia =
  typeof window.matchMedia === 'function' ? window.matchMedia(EDITOR_FONT_FLOOR_MEDIA_QUERY) : null
const hasFontFloor = shallowRef(fontFloorMedia?.matches ?? false)
const fontFloorApplies = computed(
  () => (props.isMobile || hasFontFloor.value) && props.preferences.fontSizePx < 16,
)

function updateFontFloor(): void {
  hasFontFloor.value = fontFloorMedia?.matches ?? false
}
const numericFields: { key: NumericField; label: string; unit: string }[] = [
  { key: 'fontSizePx', label: 'Font size', unit: 'px' },
  { key: 'lineHeight', label: 'Line height', unit: 'ratio' },
  { key: 'tabWidth', label: 'Tab width', unit: 'spaces' },
]
let dialogMode: 'modal' | 'nonmodal' | null = null

function closeExplicitly(): void {
  restoreInvalidDrafts()
  emit('close')
  dialog.value?.close()
  dialogMode = null
  props.returnFocus?.focus()
}

function commitDraft(key: EditorDisplayNumericPreference, rawValue: string): void {
  drafts.value = { ...drafts.value, [key]: rawValue }
  if (isIncompleteNumericDraft(rawValue)) {
    errors.value = { ...errors.value, [key]: undefined }
    return
  }

  const normalized = rawValue.trim().replace(',', '.')
  const value = Number(normalized)
  const isDecimal = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)
  if (!isDecimal || !isValidEditorDisplayNumber(key, value)) {
    errors.value = {
      ...errors.value,
      [key]: `Enter a decimal value from ${EDITOR_DISPLAY_PREFERENCE_LIMITS[key].min} to ${EDITOR_DISPLAY_PREFERENCE_LIMITS[key].max} in steps of ${EDITOR_DISPLAY_PREFERENCE_LIMITS[key].step}.`,
    }
    return
  }

  errors.value = { ...errors.value, [key]: undefined }
  if (key === 'writingColumnCharacters') {
    emit('update', { writingColumn: { characters: value, kind: 'characters' } })
    return
  }
  emit('update', { [key]: value })
}

function commitOnEnter(key: EditorDisplayNumericPreference): void {
  if (errors.value[key] || isIncompleteNumericDraft(drafts.value[key])) {
    restoreDraft(key)
  }
}

function committedValue(key: EditorDisplayNumericPreference): number {
  if (key === 'writingColumnCharacters') return writingColumnCharacters.value
  return props.preferences[key]
}

function handleCancel(event: Event): void {
  event.preventDefault()
  closeExplicitly()
}

function handleDialogClick(event: MouseEvent): void {
  if (props.isMobile || event.target !== dialog.value) return
  restoreInvalidDrafts()
  emit('close')
  dialog.value?.close()
  dialogMode = null
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (!props.isOpen || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  closeExplicitly()
}

function handleOutsideInteraction(event: Event): void {
  if (!props.isOpen || !dialog.value?.open || props.isMobile || !(event.target instanceof Node))
    return
  if (dialog.value?.contains(event.target)) return

  restoreInvalidDrafts()
  emit('close')
  dialog.value?.close()
  dialogMode = null
}

function isIncompleteNumericDraft(rawValue: string): boolean {
  const value = rawValue.trim().replace(',', '.')
  return /^[+-]?(?:\d*\.)?$/.test(value) || /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)[eE][+-]?$/.test(value)
}

function restoreDraft(key: EditorDisplayNumericPreference): void {
  drafts.value = { ...drafts.value, [key]: String(committedValue(key)) }
  errors.value = { ...errors.value, [key]: undefined }
}

function restoreInvalidDrafts(): void {
  for (const key of ['fontSizePx', 'lineHeight', 'tabWidth', 'writingColumnCharacters'] as const) {
    if (errors.value[key] || isIncompleteNumericDraft(drafts.value[key])) restoreDraft(key)
  }
}

function setDialogMode(): void {
  const element = dialog.value
  if (!element) return
  const nextMode = props.isMobile ? 'modal' : 'nonmodal'

  if (!props.isOpen) {
    if (element.open) element.close()
    dialogMode = null
    restoreInvalidDrafts()
    return
  }

  if (element.open && dialogMode === nextMode) return
  if (element.open) element.close()
  if (nextMode === 'modal') element.showModal()
  else element.show()
  dialogMode = nextMode
}

function updateWordWrap(event: Event): void {
  if (event.target instanceof HTMLInputElement) emit('update', { wordWrap: event.target.checked })
}

function updateWritingColumn(event: Event): void {
  if (!(event.target instanceof HTMLSelectElement)) return
  if (event.target.value === 'full-width') {
    emit('update', { writingColumn: { kind: 'full-width' } })
    return
  }
  emit('update', {
    writingColumn: { characters: writingColumnCharacters.value, kind: 'characters' },
  })
}

watch(() => [props.isOpen, props.isMobile] as const, setDialogMode, { flush: 'post' })
watch(
  () => props.preferences,
  (preferences) => {
    drafts.value = {
      fontSizePx: String(preferences.fontSizePx),
      lineHeight: String(preferences.lineHeight),
      tabWidth: String(preferences.tabWidth),
      writingColumnCharacters: String(writingColumnCharacters.value),
    }
  },
)
onMounted(() => {
  setDialogMode()
  document.addEventListener('click', handleOutsideInteraction, true)
  document.addEventListener('focusin', handleOutsideInteraction)
  document.addEventListener('keydown', handleDocumentKeydown)
  fontFloorMedia?.addEventListener('change', updateFontFloor)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideInteraction, true)
  document.removeEventListener('focusin', handleOutsideInteraction)
  document.removeEventListener('keydown', handleDocumentKeydown)
  fontFloorMedia?.removeEventListener('change', updateFontFloor)
})
</script>

<template>
  <dialog
    ref="dialog"
    class="editor-display-settings"
    :class="{ 'editor-display-settings--mobile': isMobile }"
    aria-labelledby="editor-display-settings-title"
    @cancel="handleCancel"
    @click="handleDialogClick"
  >
    <!-- Removing closed controls keeps their native undo entries out of source editing. -->
    <form
      v-if="isOpen"
      class="editor-display-settings__panel"
      @submit.prevent="restoreInvalidDrafts"
    >
      <header class="editor-display-settings__header">
        <h2 id="editor-display-settings-title">Editor display</h2>
        <button
          type="button"
          class="editor-display-settings__close"
          aria-label="Close settings"
          @click="closeExplicitly"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <p class="editor-display-settings__explanation">
        These preferences affect source editing only. They save locally on this device.
      </p>

      <label v-for="field in numericFields" :key="field.key" class="editor-display-settings__field">
        <span>{{ field.label }}</span>
        <span class="editor-display-settings__input-wrap">
          <EditorDisplayNumberInput
            :label="field.label"
            :invalid="Boolean(errors[field.key])"
            :described-by="`editor-display-${field.key}-range${errors[field.key] ? ` editor-display-${field.key}-error` : ''}`"
            :min="EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].min"
            :max="EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].max"
            :step="EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].step"
            :value="drafts[field.key]"
            @update="commitDraft(field.key, $event)"
            @blur="restoreDraft(field.key)"
            @keydown.enter.prevent="commitOnEnter(field.key)"
          />
          <span class="editor-display-settings__unit" aria-hidden="true">{{ field.unit }}</span>
        </span>
        <span :id="`editor-display-${field.key}-range`" class="editor-display-settings__range"
          >{{ EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].min }} to
          {{ EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].max }} {{ field.unit }}, step
          {{ EDITOR_DISPLAY_PREFERENCE_LIMITS[field.key].step }}</span
        >
        <span
          v-if="errors[field.key]"
          :id="`editor-display-${field.key}-error`"
          class="editor-display-settings__error"
          role="alert"
          >{{ errors[field.key] }}</span
        >
      </label>

      <label class="editor-display-settings__field">
        <span>Writing column</span>
        <select
          aria-label="Writing column"
          :value="preferences.writingColumn.kind"
          @change="updateWritingColumn"
        >
          <option value="characters">Custom width</option>
          <option value="full-width">Full width</option>
        </select>
      </label>
      <label
        v-if="preferences.writingColumn.kind === 'characters'"
        class="editor-display-settings__field"
      >
        <span>Column width</span>
        <span class="editor-display-settings__input-wrap">
          <EditorDisplayNumberInput
            label="Column width"
            :invalid="Boolean(errors.writingColumnCharacters)"
            :described-by="`editor-display-column-range${errors.writingColumnCharacters ? ' editor-display-writingColumnCharacters-error' : ''}`"
            :min="EDITOR_DISPLAY_PREFERENCE_LIMITS.writingColumnCharacters.min"
            :max="EDITOR_DISPLAY_PREFERENCE_LIMITS.writingColumnCharacters.max"
            :step="EDITOR_DISPLAY_PREFERENCE_LIMITS.writingColumnCharacters.step"
            :value="drafts.writingColumnCharacters"
            @update="commitDraft('writingColumnCharacters', $event)"
            @blur="restoreDraft('writingColumnCharacters')"
            @keydown.enter.prevent="commitOnEnter('writingColumnCharacters')"
          />
          <span class="editor-display-settings__unit" aria-hidden="true">characters</span>
        </span>
        <span id="editor-display-column-range" class="editor-display-settings__range"
          >40 to 120 characters, step 1. Approximate character width.</span
        >
        <span
          v-if="errors.writingColumnCharacters"
          id="editor-display-writingColumnCharacters-error"
          class="editor-display-settings__error"
          role="alert"
          >{{ errors.writingColumnCharacters }}</span
        >
      </label>

      <label class="editor-display-settings__check">
        <input
          aria-label="Word wrap"
          type="checkbox"
          :checked="preferences.wordWrap"
          @change="updateWordWrap"
        />
        <span>Word wrap</span>
      </label>
      <p v-if="fontFloorApplies" class="editor-display-settings__note">
        Font size is at least 16 px on this screen to prevent focus zoom.
      </p>
      <p v-if="persistenceError" class="editor-display-settings__warning" role="alert">
        Settings are active for this session. {{ persistenceError }}
        <button type="button" @click="emit('retry')">Try again</button>
      </p>
      <footer class="editor-display-settings__footer">
        <button type="button" class="editor-display-settings__reset" @click="emit('reset')">
          Reset editor display
        </button>
      </footer>
    </form>
  </dialog>
  <p
    v-if="persistenceError && !isOpen"
    class="editor-display-settings__external-warning"
    role="alert"
  >
    Settings are active for this session. {{ persistenceError }}
    <button type="button" @click="emit('retry')">Try again</button>
  </p>
</template>

<style scoped>
.editor-display-settings {
  position: fixed;
  inset: 56px 16px auto auto;
  width: min(310px, calc(100vw - 32px));
  max-width: none;
  max-height: min(80vh, 620px);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--raised-bg);
  color: var(--text);
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
  font: inherit;
  font-size: 13px;
}

.editor-display-settings::backdrop {
  background: rgb(0 0 0 / 32%);
}

.editor-display-settings__panel {
  display: grid;
  gap: 12px;
  max-height: inherit;
  overflow-y: auto;
  padding: 16px;
}

.editor-display-settings__header,
.editor-display-settings__field,
.editor-display-settings__input-wrap,
.editor-display-settings__check,
.editor-display-settings__footer {
  display: flex;
  align-items: center;
}

.editor-display-settings__header,
.editor-display-settings__footer {
  justify-content: space-between;
}

.editor-display-settings__header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.editor-display-settings__close,
.editor-display-settings__reset,
.editor-display-settings__warning button {
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.editor-display-settings__close {
  width: 28px;
  height: 28px;
  font-size: 22px;
}

.editor-display-settings__explanation,
.editor-display-settings__note,
.editor-display-settings__warning {
  margin: 0;
  line-height: 1.5;
}

.editor-display-settings__explanation,
.editor-display-settings__range,
.editor-display-settings__unit {
  color: var(--text-muted);
}

.editor-display-settings__field {
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 12px;
}

.editor-display-settings__input-wrap {
  width: 126px;
  min-height: 34px;
  border: 1px solid var(--border-dark);
  border-radius: 5px;
  background: var(--surface);
}

.editor-display-settings__input-wrap input {
  min-width: 0;
  width: 100%;
  padding: 6px 0 6px 8px;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
}

.editor-display-settings__unit {
  padding: 0 7px;
  white-space: nowrap;
}

.editor-display-settings__range,
.editor-display-settings__error {
  flex-basis: 100%;
  font-size: 11px;
}

.editor-display-settings__error,
.editor-display-settings__warning {
  color: var(--danger, #a12622);
}

.editor-display-settings__external-warning {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 5;
  max-width: min(360px, calc(100vw - 32px));
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--raised-bg);
  color: var(--danger, #a12622);
  box-shadow: 0 6px 20px rgb(0 0 0 / 12%);
}

.editor-display-settings__external-warning button {
  margin-left: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.editor-display-settings select {
  min-height: 32px;
  border: 1px solid var(--border-dark);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.editor-display-settings__check {
  gap: 8px;
}

.editor-display-settings__warning button {
  margin-left: 6px;
  text-decoration: underline;
}

.editor-display-settings__footer {
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.editor-display-settings__reset {
  padding: 7px 9px;
  color: var(--text-muted);
}

.editor-display-settings button:focus-visible,
.editor-display-settings input:focus-visible,
.editor-display-settings select:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.editor-display-settings--mobile {
  inset: auto 0 0;
  width: 100%;
  max-width: none;
  max-height: min(85dvh, 680px);
  border-radius: 12px 12px 0 0;
}

.editor-display-settings--mobile input,
.editor-display-settings--mobile select {
  font-size: 16px;
}
</style>
