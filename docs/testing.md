# Testing

## App test environment

The `app` Vitest project uses `isolate: false` to reuse one jsdom environment per worker. Test files in the same worker share the document, prototypes, and module state.

Every app spec must leave the shared environment as it found it:

- Restore changed globals and prototype methods with `restoreProperty`.
- Track mounted components with `trackMountedWrapper` and call `unmountTrackedWrappers` in `afterEach`.
- Clear local and session storage.
- Restore timers, mocks, and stubs.

Use the helpers in `packages/app/src/__tests__/testEnvironment.ts`.

Do not use `enableAutoUnmount` from Vue Test Utils. It allows only one registration per worker, so it fails when two test files share a worker. The lint rule rejects the import in app specs.

The app test setup fails a test when Vue emits a `[Vue warn]`. Fix the warning instead of silencing it. When a test must replace `console.warn`, use `captureVueWarning` as the mock implementation so Vue warnings still reach the guard.

## Order independence

Run the app suite in one worker with shuffled file and test order:

```sh
vpr test:unit:order
```

CI runs this after the normal unit suite. Reproduce a failure with the seed printed at the start of the run.

## Test-only modules

Keep test-only modules under `src/__tests__`. The app release filters exclude `__tests__`, so a helper outside that folder makes the change release-affecting and requires a changeset.
