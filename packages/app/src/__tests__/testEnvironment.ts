interface Unmountable {
  unmount: () => void
}

const mountedWrappers: Unmountable[] = []

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

export function trackMountedWrapper<T extends Unmountable>(wrapper: T): T {
  mountedWrappers.push(wrapper)
  return wrapper
}

export function unmountTrackedWrappers(): void {
  for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount()
}
