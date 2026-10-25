# Coding Standards

Rules for writing and reviewing code in Markdown Studio. Apply these while implementing changes, not only during review.

Prefer the simplest implementation that solves the current problem.

## Functions and abstractions

- Keep related logic in one function when it remains easy to read.
- Keep single-use logic inline by default. Extract a helper when it is reused, isolates a complex boundary, or names a meaningful operation that makes the caller easier to understand.
- For complex operations, keep the main function focused on the happy path. Move substantial validation branches and supporting details into small helpers below the main function.
- Keep helpers close to their callers. Prefer a local helper over a shared utility until the logic is duplicated.
- Prefer direct code over wrappers, configuration options, and abstraction layers that do not serve a current requirement.

### Example

```ts
// Good: the main operation shows the happy path.
export async function exportDocument(input: unknown) {
  const request = assertExportInput(input)
  const filePath = await showExportDialog(request.suggestedPath)
  return writeHtmlFile(filePath, request.documentHtml)
}

function writeHtmlFile(filePath: string, documentHtml: string): Promise<void> {
  // Write the exported HTML after the dialog resolves.
}
```

A simple operation does not need this structure. Keep it inline when extraction would make the code harder to follow.

## Components and composables

- Use `<script setup lang="ts">` for Vue components. Keep the template declarative and move branching logic into computed values.
- Keep components focused on presentation and local interaction. Put shared state, side effects, and reusable behavior in composables, stores, or services.
- Extract a composable when the same reactive behavior appears in more than one component, or when it isolates a browser or desktop boundary.
- Return a narrow object from a composable: the refs, computed values, and functions that callers use.

## Validation and types

- Validate unknown or untrusted values once at the boundary that owns them: Electron IPC payloads, `localStorage` entries, file contents, external URLs, and rendered Markdown HTML.
- Add new payload validation to `packages/desktop-contract`, not to each caller.
- Pass validated, typed values into internal code. Trust established contracts, constructors, and TypeScript types instead of repeating runtime checks.
- Avoid `any`. Use `unknown` for values that have not been validated, then narrow them to a specific type.
- Prefer type inference for local variables and return values.
- Add explicit types when they define a public contract, prevent unwanted inference, or improve clarity.
- Reuse the types and channel names in `packages/desktop-contract` instead of redeclaring message shapes.
- Preserve the distinction between compile-time types and runtime validation. A TypeScript assertion does not validate an IPC payload.

### Example

```ts
// Good: validate at the boundary.
const payload = assertSaveInput(input)
return writeMarkdownDocument(payload)

// Avoid: repeat structural checks in internal code.
if (typeof payload === 'object' && payload !== null) {
  // Check the same properties again.
}
```

## Variables and state

- Prefer `const`. Use `let` only when reassignment is necessary and produces clearer code.
- Prefer `ref` and `computed` over mutable module-level state in composables. Reset state when the input it derives from changes.
- Prefer expressions over mutable intermediate state.
- Inline a value used only once when doing so keeps the expression readable.
- Keep a named variable when it explains intent, shortens a complex expression, or makes debugging easier.
- Avoid aliases that only rename a value without adding meaning.

### Example

```ts
// Good
const draft = await restoreWorkspaceDraft()

// Avoid unnecessary intermediate variables.
const restored = await restoreWorkspaceDraft()
const draft = restored
```

```ts
// Good
const viewMode = isNarrowViewport ? 'editor' : 'split'

// Avoid unnecessary reassignment.
let viewMode = 'split'
if (isNarrowViewport) viewMode = 'editor'
```

## Control flow

- Prefer early returns and guard clauses over nested branches.
- Avoid `else` after a branch that returns, throws, or otherwise terminates.
- Use ternaries for simple expressions with two clear alternatives.
- Use `if` statements or a `switch` when a ternary would be nested or difficult to read.
- Keep the normal execution path clear and avoid unnecessary indentation.

### Example

```ts
// Good
function resolveTitle(title: string | null): string {
  if (title) return title
  return UNTITLED_DOCUMENT_NAME
}

// Avoid
function resolveTitle(title: string | null): string {
  if (title) return title
  else return UNTITLED_DOCUMENT_NAME
}
```

## Collections and iteration

- Prefer `map`, `filter`, and `flatMap` when transforming collections.
- Use `find`, `some`, and `every` when they directly express the intended operation.
- Use type predicates when filtering needs to narrow a union type.
- Use a loop when the operation requires sequential side effects, early termination, or complex state that would make functional methods harder to read.
- Avoid intermediate arrays that do not improve clarity.

### Example

```ts
// Good
const enabledCommands = commands
  .filter((command): command is Command => command.enabled)
  .map((command) => command.title)
```

The type predicate must correctly describe the runtime condition. Do not use a predicate merely to force TypeScript to accept an unsafe type.

## Errors and failure handling

- Let errors propagate to the boundary responsible for handling them.
- Use `try`/`catch` only when the current layer can recover, add useful context, perform required cleanup, or translate an error into its public contract.
- Prefer explicit result types for expected failures when they fit the existing API.
- Surface a failed file operation or IPC call to the user. A rejected desktop API promise is a failure the user needs to see, not a log line.
- Avoid catch-and-rethrow blocks that add no information.
- Never silently swallow unexpected failures.

## Complexity and scope

- Solve demonstrated problems and concrete requirements before adding speculative safeguards.
- Before implementing protection for an unlikely race condition or edge case, explain the failure mode, likelihood, and implementation cost to the user. Get approval before expanding scope.
- Treat the security boundaries in `AGENTS.md` as existing requirements, not speculative improvements.

## Comments

- Add comments for non-obvious constraints, important tradeoffs, and surprising behavior.
- Explain why a constraint exists rather than restating what the code does.
- Prefer meaningful names and straightforward control flow over explanatory comments.

## Review standard

Before completing a change, re-read this document and check every rule against the changed code.

Also check that existing behavior and the security boundaries in `AGENTS.md` remain intact.

Apply these rules with judgment. A shorter implementation is not better when it reduces clarity or correctness.
