import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { Shortcut } from '../../types/shortcuts'

import ShortcutsHelp from '../ShortcutsHelp.vue'

const shortcuts: Shortcut[] = [
  {
    group: 'Editor',
    id: 'editor:find',
    keys: ['Mod', 'F'],
    label: 'Find',
  },
  {
    group: 'View',
    id: 'shortcuts:palette',
    keys: ['Mod', 'K'],
    label: 'Command Palette',
  },
]

function mountShortcutsHelp(overrides: Record<string, unknown> = {}) {
  return mount(ShortcutsHelp, {
    props: {
      isOpen: true,
      shortcuts,
      ...overrides,
    },
  })
}

describe('ShortcutsHelp', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders shortcuts grouped by their group', () => {
    const wrapper = mountShortcutsHelp()

    expect(wrapper.text()).toContain('Editor')
    expect(wrapper.text()).toContain('View')
    expect(wrapper.text()).toContain('Find')
    expect(wrapper.text()).toContain('Command Palette')
  })

  it('emits close when the modal closes', async () => {
    const wrapper = mountShortcutsHelp()

    wrapper.findComponent({ name: 'Modal' }).vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not render when closed', () => {
    const wrapper = mountShortcutsHelp({ isOpen: false })

    expect(wrapper.find('.modal-overlay.open').exists()).toBe(false)
  })

  it('renders formatted shortcut labels', () => {
    const wrapper = mountShortcutsHelp()

    const keys = wrapper.findAll('.shortcuts-row__keys')
    expect(keys.length).toBe(2)
    expect(keys[0]?.text()).toBeTruthy()
    expect(keys[1]?.text()).toBeTruthy()
  })

  it('groups multiple shortcuts under the same group heading', () => {
    const groupedShortcuts: Shortcut[] = [
      { group: 'Editor', id: 'editor:find', keys: ['Mod', 'F'], label: 'Find' },
      { group: 'Editor', id: 'editor:replace', keys: ['Mod', 'H'], label: 'Replace' },
      { group: 'View', id: 'shortcuts:palette', keys: ['Mod', 'K'], label: 'Command Palette' },
    ]

    const wrapper = mountShortcutsHelp({ shortcuts: groupedShortcuts })

    const groupTitles = wrapper.findAll('.shortcuts-group__title')
    expect(groupTitles.length).toBe(2)
    expect(groupTitles[0]?.text()).toBe('Editor')
    expect(groupTitles[1]?.text()).toBe('View')

    const rows = wrapper.findAll('.shortcuts-row')
    expect(rows.length).toBe(3)
  })

  it('renders empty when shortcuts list is empty', () => {
    const wrapper = mountShortcutsHelp({ shortcuts: [] })

    expect(wrapper.find('.shortcuts-group').exists()).toBe(false)
    expect(wrapper.find('.shortcuts-row').exists()).toBe(false)
  })
})
