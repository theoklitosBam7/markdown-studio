import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import type { DocumentFolderNode } from '../../types'

import FolderSidebar from '../FolderSidebar.vue'

const rootNode: DocumentFolderNode = {
  depth: 0,
  folderId: 'folder-1',
  isExpanded: true,
  key: 'folder-1:.',
  kind: 'folder',
  label: 'notes',
  path: '/tmp/notes',
  relativePath: '.',
}

const fileNode: DocumentFolderNode = {
  depth: 1,
  folderId: 'folder-1',
  isExpanded: false,
  key: 'folder-1:notes.md',
  kind: 'file',
  label: 'notes.md',
  path: '/tmp/notes/notes.md',
  relativePath: 'notes.md',
}

const mountedWrappers: ReturnType<typeof mount>[] = []

afterEach(() => {
  for (const wrapper of mountedWrappers.splice(0)) {
    wrapper.unmount()
  }
})

function mountSidebar(overrides: Record<string, unknown> = {}) {
  const wrapper = mount(FolderSidebar, {
    attachTo: document.body,
    props: {
      activePath: null,
      message: null,
      nodes: [rootNode, fileNode],
      tab: 'folders',
      ...overrides,
    },
  })

  mountedWrappers.push(wrapper)

  return wrapper
}

describe('FolderSidebar', () => {
  it('shows the empty state when no Document Folder is open', () => {
    const wrapper = mountSidebar({ nodes: [] })

    expect(wrapper.text()).toContain('No folders open. Add a folder to browse its Markdown files.')
  })

  it('opens a Markdown Document on single click', async () => {
    const wrapper = mountSidebar()

    await wrapper.findAll('.folder-sidebar__node')[1]?.trigger('click')

    expect(wrapper.emitted('open')).toEqual([[fileNode]])
  })

  it('toggles a folder on click instead of opening it', async () => {
    const wrapper = mountSidebar()

    await wrapper.findAll('.folder-sidebar__node')[0]?.trigger('click')

    expect(wrapper.emitted('open')).toBeUndefined()
    expect(wrapper.emitted('toggle')).toEqual([[rootNode]])
  })

  it('moves through the tree with the keyboard and opens with Enter', async () => {
    const wrapper = mountSidebar()
    const [rootButton, fileButton] = wrapper.findAll('.folder-sidebar__node')

    ;(rootButton?.element as HTMLElement | undefined)?.focus()
    await rootButton?.trigger('keydown', { key: 'ArrowDown' })

    expect(document.activeElement).toBe(fileButton?.element)

    await fileButton?.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('open')).toEqual([[fileNode]])
  })

  it('expands and collapses a folder with the arrow keys', async () => {
    const wrapper = mountSidebar({ nodes: [{ ...rootNode, isExpanded: false }] })
    const rootButton = wrapper.find('.folder-sidebar__node')

    await rootButton.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('toggle')).toEqual([[{ ...rootNode, isExpanded: false }]])
  })

  it('shows an inline message when a folder cannot be read', () => {
    const wrapper = mountSidebar({ message: 'Cannot read this folder.' })

    expect(wrapper.find('.folder-sidebar__message').text()).toBe('Cannot read this folder.')
  })

  it('highlights the active document when it sits under a Document Folder', () => {
    const wrapper = mountSidebar({ activePath: '/tmp/notes/notes.md' })
    const [, fileButton] = wrapper.findAll('.folder-sidebar__node')

    expect(fileButton?.attributes('aria-current')).toBe('true')
    expect(fileButton?.classes()).toContain('folder-sidebar__node--active')
  })

  it('does not highlight a document opened outside every Document Folder', () => {
    const wrapper = mountSidebar({ activePath: '/elsewhere/notes.md' })
    const [, fileButton] = wrapper.findAll('.folder-sidebar__node')

    expect(fileButton?.attributes('aria-current')).toBeUndefined()
  })

  it('adds and removes Document Folders through the panel actions', async () => {
    const wrapper = mountSidebar()

    await wrapper.find('.folder-sidebar__add').trigger('click')
    await wrapper.find('.folder-sidebar__remove').trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
    expect(wrapper.emitted('remove')).toEqual([['folder-1']])
  })

  it('switches the sidebar tab', async () => {
    const wrapper = mountSidebar()
    const buttons = wrapper.findAll('.sidebar-tabs__tab')

    await buttons[0]?.trigger('click')

    expect(wrapper.emitted('changeTab')).toEqual([['outline']])
  })
})
