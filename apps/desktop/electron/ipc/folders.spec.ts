// @vitest-environment node

import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import {
  createDocumentFolderRegistry,
  type DocumentFolderStore,
  listDocumentFolder,
  readDocumentFolderFile,
  readDocumentModificationTime,
} from './folders'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('document folder registry', () => {
  it('restores a remembered Document Folder list', async () => {
    const documentFolder = await createDocumentFolder()
    const registry = createDocumentFolderRegistry(createStore([documentFolder]))

    const restored = await registry.restore()

    expect(restored.removedCount).toBe(0)
    expect(restored.folders).toHaveLength(1)
    expect(restored.folders[0].path).toBe(await realpath(documentFolder))
  })

  it('drops a remembered Document Folder that no longer exists', async () => {
    const documentFolder = await createDocumentFolder()
    const registry = createDocumentFolderRegistry(
      createStore([documentFolder, join(documentFolder, 'gone')]),
    )

    const restored = await registry.restore()

    expect(restored.removedCount).toBe(1)
    expect(restored.folders).toHaveLength(1)
  })

  it('refuses to add a Document Folder that is already open', async () => {
    const documentFolder = await createDocumentFolder()
    const registry = createDocumentFolderRegistry(createStore([]))

    const first = await registry.add(documentFolder)
    const second = await registry.add(documentFolder)

    expect(first.ok).toBe(true)
    expect(second).toEqual({ ok: false, reason: 'duplicate' })
  })

  it('removes a Document Folder and persists the remaining list', async () => {
    const documentFolder = await createDocumentFolder()
    const store = createStore([])
    const registry = createDocumentFolderRegistry(store)
    const added = await registry.add(documentFolder)
    if (!added.ok) throw new Error('Expected the Document Folder to be added.')

    await registry.remove(added.folder.id)

    expect(store.read()).toEqual([])
  })

  it('refuses to list a Document Folder id it does not know', async () => {
    const registry = createDocumentFolderRegistry(createStore([]))

    expect(await registry.list({ folderId: 'missing', relativePath: '.' })).toEqual({ ok: false })
  })
})

async function createDocumentFolder(): Promise<string> {
  const documentFolder = await mkdtemp(join(tmpdir(), 'markdown-studio-folders-'))
  temporaryDirectories.push(documentFolder)
  return documentFolder
}

function createStore(initial: string[]): DocumentFolderStore & { read: () => string[] } {
  let paths = initial

  return {
    read: () => paths,
    readDocumentFolderPaths: async () => paths,
    writeDocumentFolderPaths: async (next) => {
      paths = next
    },
  }
}

describe('document folder listing', () => {
  it('lists folders before files and hides unsupported entries', async () => {
    const documentFolder = await createDocumentFolder()
    await mkdir(join(documentFolder, 'sub'))
    await mkdir(join(documentFolder, 'node_modules'))
    await mkdir(join(documentFolder, '.git'))
    await writeFile(join(documentFolder, 'notes.md'), '# Notes')
    await writeFile(join(documentFolder, 'todo.txt'), 'todo')
    await writeFile(join(documentFolder, 'readme.MARKDOWN'), '# Readme')
    await writeFile(join(documentFolder, 'image.png'), 'png')
    await writeFile(join(documentFolder, '.hidden.md'), '# Hidden')
    await writeFile(join(documentFolder, 'node_modules', 'dependency.md'), '# Dependency')

    const listing = await listDocumentFolder(documentFolder, '.')

    expect(listing).toEqual({
      entries: [
        { kind: 'folder', name: 'sub', relativePath: 'sub' },
        { kind: 'file', name: 'notes.md', relativePath: 'notes.md' },
        { kind: 'file', name: 'readme.MARKDOWN', relativePath: 'readme.MARKDOWN' },
        { kind: 'file', name: 'todo.txt', relativePath: 'todo.txt' },
      ],
      ok: true,
    })
  })

  it('refuses a relative path that resolves outside its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    const outsideFolder = await createDocumentFolder()
    await writeFile(join(outsideFolder, 'outside.md'), '# Outside')

    expect(
      await listDocumentFolder(documentFolder, '../' + outsideFolder.split('/').pop()),
    ).toEqual({ ok: false })
  })

  it('refuses a symbolic link that points outside its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    const outsideFolder = await createDocumentFolder()
    await writeFile(join(outsideFolder, 'outside.md'), '# Outside')
    await symlink(outsideFolder, join(documentFolder, 'escape'))

    expect(await listDocumentFolder(documentFolder, 'escape')).toEqual({ ok: false })
  })

  it('lists a symbolic link that stays inside its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    await mkdir(join(documentFolder, 'notes'))
    await writeFile(join(documentFolder, 'notes', 'inner.md'), '# Inner')
    await symlink(join(documentFolder, 'notes'), join(documentFolder, 'alias'))

    expect(await listDocumentFolder(documentFolder, 'alias')).toEqual({
      entries: [{ kind: 'file', name: 'inner.md', relativePath: 'alias/inner.md' }],
      ok: true,
    })
  })

  it('lists a symbolic link as a folder when it stays inside its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    await mkdir(join(documentFolder, 'notes'))
    await symlink(join(documentFolder, 'notes'), join(documentFolder, 'alias'))

    expect(await listDocumentFolder(documentFolder, '.')).toEqual({
      entries: [
        { kind: 'folder', name: 'alias', relativePath: 'alias' },
        { kind: 'folder', name: 'notes', relativePath: 'notes' },
      ],
      ok: true,
    })
  })

  it('reports an unreadable directory instead of throwing', async () => {
    const documentFolder = await createDocumentFolder()

    expect(await listDocumentFolder(documentFolder, 'missing')).toEqual({ ok: false })
  })
})

describe('document folder file access', () => {
  it('opens a Markdown Document from its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    await writeFile(join(documentFolder, 'notes.md'), '# Notes')

    const document = await readDocumentFolderFile(documentFolder, 'notes.md')

    expect(document?.content).toBe('# Notes')
    expect(document?.path).toBe(join(await realpath(documentFolder), 'notes.md'))
    expect(typeof document?.modifiedAt).toBe('number')
  })

  it('refuses to open a file outside its Document Folder', async () => {
    const documentFolder = await createDocumentFolder()
    const outsideFolder = await createDocumentFolder()
    await writeFile(join(outsideFolder, 'outside.md'), '# Outside')

    const escapedPath = `../${outsideFolder.split('/').pop()}/outside.md`

    expect(await readDocumentFolderFile(documentFolder, escapedPath)).toBeNull()
  })

  it('reports the modification time of a document and null when it is missing', async () => {
    const documentFolder = await createDocumentFolder()
    await writeFile(join(documentFolder, 'notes.md'), '# Notes')

    expect(typeof (await readDocumentModificationTime(join(documentFolder, 'notes.md')))).toBe(
      'number',
    )
    expect(await readDocumentModificationTime(join(documentFolder, 'missing.md'))).toBeNull()
  })
})
