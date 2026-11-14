import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import EditorDisplaySettings from '../EditorDisplaySettings.vue'
import { DEFAULT_EDITOR_DISPLAY_PREFERENCES } from '../../types/editorDisplayPreferences'

function mountSettings(overrides: { isMobile?: boolean } = {}) {
  return mount(EditorDisplaySettings, {
    attachTo: document.body,
    props: {
      isMobile: overrides.isMobile ?? false,
      isOpen: true,
      persistenceError: null,
      preferences: DEFAULT_EDITOR_DISPLAY_PREFERENCES,
      returnFocus: null,
    },
  })
}

describe('EditorDisplaySettings', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    HTMLDialogElement.prototype.show = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
  })

  it('exposes numeric settings as labelled decimal spinbuttons with their current range', () => {
    const wrapper = mountSettings()
    const input = wrapper.get('[aria-label="Font size"]')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('inputmode')).toBe('decimal')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('autocapitalize')).toBe('off')
    expect(input.attributes('spellcheck')).toBe('false')
    expect(input.attributes('role')).toBe('spinbutton')
    expect(input.attributes('aria-valuenow')).toBe('16')
    expect(input.attributes('aria-valuemin')).toBe('12')
    expect(input.attributes('aria-valuemax')).toBe('32')
    const descriptions = (input.attributes('aria-describedby') ?? '').split(' ').filter(Boolean)
    const text = descriptions.map((id) => document.getElementById(id)?.textContent).join(' ')
    expect(text).toContain('12 to 32 px')
    expect(text).toContain('step 0.5')
    wrapper.unmount()
  })

  it('applies a valid font size draft immediately', async () => {
    const wrapper = mountSettings()
    await wrapper.get('[aria-label="Font size"]').setValue('18')

    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 18 }]])
    wrapper.unmount()
  })

  it('steps a numeric preference with the Up and Down keys', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.element.value).toBe('16.5')
    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 16.5 }]])

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.element.value).toBe('16')
    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 16.5 }], [{ fontSizePx: 16 }]])
    wrapper.unmount()
  })

  it('returns an invalid stepped draft to the preference step with an arrow key', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    await input.setValue('13.25')
    expect(wrapper.emitted('update')).toBeUndefined()

    await input.trigger('keydown', { key: 'ArrowUp' })

    expect(input.element.value).toBe('13.5')
    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 13.5 }]])
    wrapper.unmount()
  })

  it('replaces selected text through a cancelable beforeinput event', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(0, 2)
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: '18',
      inputType: 'insertText',
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('18')
    expect(input.element.selectionStart).toBe(2)
    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 18 }]])
    wrapper.unmount()
  })

  it('cuts selected text through the local edit path', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(1, 2)
    const setData = vi.fn()
    const event = new Event('cut', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { setData },
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(setData).toHaveBeenCalledWith('text/plain', '6')
    expect(input.element.value).toBe('1')
    wrapper.unmount()
  })

  it('pastes text into the selected range without native input', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(0, 2)
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => '18' },
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('18')
    expect(wrapper.emitted('update')).toEqual([[{ fontSizePx: 18 }]])
    wrapper.unmount()
  })

  it('deletes at the caret through a cancelable beforeinput event', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(1, 1)
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward',
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('6')
    expect(input.element.selectionStart).toBe(0)
    expect(wrapper.emitted('update')).toBeUndefined()
    wrapper.unmount()
  })

  it('deletes the numeric word before the caret without native editing', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(2, 2)
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteWordBackward',
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('')
    expect(wrapper.emitted('update')).toBeUndefined()
    wrapper.unmount()
  })

  it('deletes the numeric word after the caret without native editing', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(0, 0)
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteWordForward',
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('')
    wrapper.unmount()
  })

  it.each(['deleteSoftLineBackward', 'deleteHardLineBackward'])(
    'deletes the line prefix locally for %s',
    async (inputType) => {
      const wrapper = mountSettings()
      const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
      input.element.setSelectionRange(1, 1)
      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType,
      })

      input.element.dispatchEvent(event)
      await wrapper.vm.$nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(input.element.value).toBe('6')
      wrapper.unmount()
    },
  )

  it.each(['deleteSoftLineForward', 'deleteHardLineForward'])(
    'deletes the line suffix locally for %s',
    async (inputType) => {
      const wrapper = mountSettings()
      const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
      input.element.setSelectionRange(1, 1)
      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType,
      })

      input.element.dispatchEvent(event)
      await wrapper.vm.$nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(input.element.value).toBe('1')
      wrapper.unmount()
    },
  )

  it('cancels unsupported editing actions instead of adding browser history', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromYank',
    })

    input.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(input.element.value).toBe('16')
    expect(wrapper.emitted('update')).toBeUndefined()
    wrapper.unmount()
  })

  it('keeps Undo and Redo inside the numeric control', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.setSelectionRange(0, 2)
    input.element.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        data: '18',
        inputType: 'insertText',
      }),
    )
    await wrapper.vm.$nextTick()

    await input.trigger('keydown', { ctrlKey: true, key: 'z' })
    expect(input.element.value).toBe('16')
    await input.trigger('keydown', { ctrlKey: true, key: 'y' })
    expect(input.element.value).toBe('18')
    expect(wrapper.emitted('update')).toEqual([
      [{ fontSizePx: 18 }],
      [{ fontSizePx: 16 }],
      [{ fontSizePx: 18 }],
    ])
    wrapper.unmount()
  })

  it('omits the current-value ARIA attribute for an empty draft', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    input.element.value = ''
    await input.trigger('input')

    expect(input.attributes('aria-valuenow')).toBeUndefined()
    wrapper.unmount()
  })

  it('accepts a decimal comma as the decimal point', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Line height"]')
    input.element.value = '1,75'
    await input.trigger('input')

    expect(wrapper.emitted('update')).toEqual([[{ lineHeight: 1.75 }]])
    expect(input.attributes('aria-valuenow')).toBe('1.75')
    wrapper.unmount()
  })

  it.each(['-', '.', '16.', '1e', '1e+'])(
    'keeps the incomplete draft %s local and restores it on blur',
    async (draft) => {
      const wrapper = mountSettings()
      const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
      await input.setValue(draft)

      expect(wrapper.emitted('update')).toBeUndefined()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(input.element.value).toBe(draft)

      await input.trigger('blur')

      expect(input.element.value).toBe('16')
      wrapper.unmount()
    },
  )

  it('rejects a non-decimal numeric draft', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    await input.setValue('0x10')

    expect(wrapper.emitted('update')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('decimal')
    expect(input.attributes('aria-valuenow')).toBeUndefined()
    wrapper.unmount()
  })

  it('shows an error for an invalid numeric draft and restores it on blur', async () => {
    const wrapper = mountSettings()
    const input = wrapper.get<HTMLInputElement>('[aria-label="Font size"]')
    await input.setValue('16.2')

    expect(wrapper.get('[role="alert"]').text()).toContain('steps of 0.5')
    expect(wrapper.emitted('update')).toBeUndefined()

    await input.trigger('blur')

    expect(input.element.value).toBe('16')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('uses native modal mode on mobile and changes mode with the breakpoint', async () => {
    const wrapper = mountSettings({ isMobile: true })
    const dialog = wrapper.get('dialog').element

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()
    expect(HTMLDialogElement.prototype.show).not.toHaveBeenCalled()

    await wrapper.setProps({ isMobile: false })

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
    expect(HTMLDialogElement.prototype.show).toHaveBeenCalledOnce()
    expect(dialog.open).toBe(true)
    wrapper.unmount()
  })

  it('dismisses on a desktop outside click without restoring the opener focus', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    const wrapper = mount(EditorDisplaySettings, {
      attachTo: document.body,
      props: {
        isMobile: false,
        isOpen: true,
        persistenceError: null,
        preferences: DEFAULT_EDITOR_DISPLAY_PREFERENCES,
        returnFocus: opener,
      },
    })
    const target = document.createElement('button')
    document.body.append(target)

    target.focus()
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(target)
    wrapper.unmount()
    opener.remove()
    target.remove()
  })

  it('dismisses a desktop panel when keyboard focus moves into the workspace', () => {
    const wrapper = mountSettings()
    const target = document.createElement('button')
    document.body.append(target)
    target.focus()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(target)
    wrapper.unmount()
    target.remove()
  })

  it('returns focus to the initiating element after explicit close or Escape', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    const wrapper = mount(EditorDisplaySettings, {
      attachTo: document.body,
      props: {
        isMobile: false,
        isOpen: true,
        persistenceError: null,
        preferences: DEFAULT_EDITOR_DISPLAY_PREFERENCES,
        returnFocus: opener,
      },
    })

    await wrapper.get('[aria-label="Close settings"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(opener)

    await wrapper.get('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
    opener.remove()
  })

  it('explains the mobile font floor for a stored font size below 16 px', () => {
    const wrapper = mount(EditorDisplaySettings, {
      props: {
        isMobile: true,
        isOpen: true,
        persistenceError: null,
        preferences: { ...DEFAULT_EDITOR_DISPLAY_PREFERENCES, fontSizePx: 14 },
        returnFocus: null,
      },
    })

    expect(wrapper.get('.editor-display-settings__note').text()).toContain('at least 16 px')
    wrapper.unmount()
  })

  it('updates the font floor explanation when pointer or viewport constraints change', async () => {
    const media = Object.assign(new EventTarget(), { matches: true })
    vi.stubGlobal('matchMedia', () => media)
    const wrapper = mountSettings()
    await wrapper.setProps({
      preferences: { ...DEFAULT_EDITOR_DISPLAY_PREFERENCES, fontSizePx: 14 },
    })
    expect(wrapper.find('.editor-display-settings__note').exists()).toBe(true)
    media.matches = false
    media.dispatchEvent(new Event('change'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.editor-display-settings__note').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits preference updates, reset, and persistence retry actions', async () => {
    const wrapper = mountSettings()
    await wrapper.get('[aria-label="Word wrap"]').setValue(false)
    await wrapper.get('[aria-label="Writing column"]').setValue('full-width')
    await wrapper.get('.editor-display-settings__reset').trigger('click')

    expect(wrapper.emitted('update')).toEqual([
      [{ wordWrap: false }],
      [{ writingColumn: { kind: 'full-width' } }],
    ])
    expect(wrapper.emitted('reset')).toHaveLength(1)

    await wrapper.setProps({ persistenceError: 'Could not save editor display settings.' })
    await wrapper.get('.editor-display-settings__warning button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)

    await wrapper.setProps({ isOpen: false })
    expect(wrapper.find('input[aria-label="Font size"]').exists()).toBe(false)
    expect(wrapper.get('.editor-display-settings__external-warning').text()).toContain(
      'Could not save',
    )
    await wrapper.get('.editor-display-settings__external-warning button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(2)
    wrapper.unmount()
  })
})
