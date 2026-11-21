interface Unmountable {
  unmount: () => void
}

const mountedWrappers: Unmountable[] = []
const vueWarnings: string[] = []

export function captureVueWarning(...args: Parameters<typeof console.warn>): void {
  if (typeof args[0] !== 'string' || !args[0].startsWith('[Vue warn]')) return
  vueWarnings.push(args.map(String).join(' '))
}

export function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor)
    return
  }

  Reflect.deleteProperty(target, property)
}

export function takeVueWarnings(): string[] {
  return vueWarnings.splice(0)
}

export function trackMountedWrapper<T extends Unmountable>(wrapper: T): T {
  mountedWrappers.push(wrapper)
  return wrapper
}

export function unmountTrackedWrappers(): void {
  for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount()
}
