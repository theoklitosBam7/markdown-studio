import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import {
  useWorkspaceSidebarPreference,
  useWorkspaceSplitPreference,
} from '../useWorkspaceLayoutPreferences'

function mountOwner<T>(usePreference: () => T) {
  let preference: T | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        preference = usePreference()
        return () => h('div')
      },
    }),
  )

  return {
    get preference() {
      if (!preference) throw new Error('Preference owner did not mount')
      return preference
    },
    unmount: () => wrapper.unmount(),
  }
}

const splitKey = 'markdown-studio:workspace-split-ratio'
const sidebarKey = 'markdown-studio:workspace-sidebar-width'

describe('useWorkspaceLayoutPreferences', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('uses the default split ratio without writing it during setup', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner(useWorkspaceSplitPreference)

    expect(owner.preference.preferredValue.value).toBe(0.5)
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })

  it('uses an independent default sidebar width without writing it during setup', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner(useWorkspaceSidebarPreference)

    expect(owner.preference.preferredValue.value).toBe(248)
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })

  it('restores each preference from its own storage key', () => {
    window.localStorage.setItem(splitKey, JSON.stringify(0.65))
    window.localStorage.setItem(sidebarKey, JSON.stringify(312))

    const splitOwner = mountOwner(useWorkspaceSplitPreference)
    const sidebarOwner = mountOwner(useWorkspaceSidebarPreference)

    expect(splitOwner.preference.preferredValue.value).toBe(0.65)
    expect(sidebarOwner.preference.preferredValue.value).toBe(312)

    splitOwner.unmount()
    sidebarOwner.unmount()
  })

  it.each([
    ['malformed JSON', '{'],
    ['null', 'null'],
    ['an object', '{"value":0.7}'],
    ['a string', '"0.7"'],
    ['a negative number', '-0.2'],
    ['a non-finite number', '1e999'],
    ['zero endpoint', '0'],
    ['one endpoint', '1'],
  ])('uses the split default for %s', (_description, storedValue) => {
    window.localStorage.setItem(splitKey, storedValue)

    const owner = mountOwner(useWorkspaceSplitPreference)

    expect(owner.preference.preferredValue.value).toBe(0.5)
    expect(owner.preference.storageError.value).toBeNull()

    owner.unmount()
  })

  it.each([
    ['malformed JSON', '{'],
    ['null', 'null'],
    ['an object', '{"value":300}'],
    ['a string', '"300"'],
    ['a negative number', '-300'],
    ['zero', '0'],
    ['a non-finite number', '1e999'],
  ])('uses the sidebar default for %s', (_description, storedValue) => {
    window.localStorage.setItem(sidebarKey, storedValue)

    const owner = mountOwner(useWorkspaceSidebarPreference)

    expect(owner.preference.preferredValue.value).toBe(248)
    expect(owner.preference.storageError.value).toBeNull()

    owner.unmount()
  })

  it('does not let an invalid preference prevent restoration of the other key', () => {
    window.localStorage.setItem(splitKey, 'null')
    window.localStorage.setItem(sidebarKey, JSON.stringify(320))

    const splitOwner = mountOwner(useWorkspaceSplitPreference)
    const sidebarOwner = mountOwner(useWorkspaceSidebarPreference)

    expect(splitOwner.preference.preferredValue.value).toBe(0.5)
    expect(sidebarOwner.preference.preferredValue.value).toBe(320)

    splitOwner.unmount()
    sidebarOwner.unmount()
  })

  it('commits a split ratio only to its own key', () => {
    window.localStorage.setItem(sidebarKey, '300')
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner(useWorkspaceSplitPreference)

    owner.preference.commit(0.7)

    expect(owner.preference.preferredValue.value).toBe(0.7)
    expect(setItem).toHaveBeenCalledExactlyOnceWith(splitKey, '0.7')
    expect(window.localStorage.getItem(sidebarKey)).toBe('300')

    owner.unmount()
  })

  it('commits a sidebar width only to its own key', () => {
    window.localStorage.setItem(splitKey, '0.6')
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner(useWorkspaceSidebarPreference)

    owner.preference.commit(320)

    expect(owner.preference.preferredValue.value).toBe(320)
    expect(setItem).toHaveBeenCalledExactlyOnceWith(sidebarKey, '320')
    expect(window.localStorage.getItem(splitKey)).toBe('0.6')

    owner.unmount()
  })

  it('uses the default and reports an expected storage read failure', () => {
    vi.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
      throw new window.DOMException('Storage is blocked', 'SecurityError')
    })

    const owner = mountOwner(useWorkspaceSplitPreference)

    expect(owner.preference.preferredValue.value).toBe(0.5)
    expect(owner.preference.storageError.value).toBe(
      'Could not restore the editor and Live Preview widths.',
    )

    owner.unmount()
  })

  it('keeps a committed choice for the session when an expected write failure occurs', () => {
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw new window.DOMException('Storage is full', 'QuotaExceededError')
    })
    const owner = mountOwner(useWorkspaceSidebarPreference)

    owner.preference.commit(340)

    expect(owner.preference.preferredValue.value).toBe(340)
    expect(owner.preference.storageError.value).toBe('Could not save the sidebar width.')

    owner.unmount()
  })

  it('propagates an unexpected storage read failure', () => {
    const failure = new Error('Unexpected storage failure')
    vi.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
      throw failure
    })

    expect(() => mountOwner(useWorkspaceSplitPreference)).toThrow(failure)
  })

  it('propagates an unexpected storage write failure after updating the session choice', () => {
    const failure = new Error('Unexpected storage failure')
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw failure
    })
    const owner = mountOwner(useWorkspaceSplitPreference)

    expect(() => owner.preference.commit(0.6)).toThrow(failure)
    expect(owner.preference.preferredValue.value).toBe(0.6)

    owner.unmount()
  })
})
