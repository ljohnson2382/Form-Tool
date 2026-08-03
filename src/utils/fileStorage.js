// Save/open form (and response export) JSON files anywhere on disk — including
// into a OneDrive/Google Drive/Dropbox synced folder — via the File System
// Access API, with a download-link + <input type=file> fallback for browsers
// that don't support it (Safari, Firefox).

export const supportsFileSystemAccess =
  typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function'

function slugifyFilename(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'form'
  )
}

function downloadBlob(blob, suggestedName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revoking immediately races the browser actually reading the blob for
  // the download in some engines, producing an empty/truncated file —
  // defer it to the next tick so the download has already started.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function downloadJson(data, suggestedName) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), suggestedName)
}

/**
 * Saves JSON data to disk. Returns 'saved' on success, or 'cancelled' if the
 * user dismissed the native picker — callers should treat 'cancelled' as a
 * no-op, not an error.
 */
export async function saveJsonToFile(data, suggestedName) {
  const filename = suggestedName.endsWith('.json') ? suggestedName : `${suggestedName}.json`

  if (supportsFileSystemAccess) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
      return 'saved'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      // NotAllowedError (and anything else) means the native picker itself
      // failed for an environmental reason — lost focus, a permissions
      // policy, a browser quirk — not that the user declined. Fall back to
      // a plain download rather than silently producing nothing.
      downloadJson(data, filename)
      return 'saved'
    }
  }

  downloadJson(data, filename)
  return 'saved'
}

export function suggestedFormFilename(form) {
  return `${slugifyFilename(form.title)}.form.json`
}

/**
 * Saves generated source code (a .jsx string) to disk — same native-picker-
 * with-download-fallback shape as saveJsonToFile, letting the user navigate
 * to any folder (e.g. their project's src/components/) in the picker. Used
 * by BuilderScreen.jsx's Deploy button; see utils/generateFormComponent.js.
 */
export async function saveJsxToFile(code, suggestedName) {
  const filename = suggestedName.endsWith('.jsx') ? suggestedName : `${suggestedName}.jsx`

  if (supportsFileSystemAccess) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'React component', accept: { 'text/javascript': ['.jsx'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(code)
      await writable.close()
      return 'saved'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      downloadBlob(new Blob([code], { type: 'text/javascript' }), filename)
      return 'saved'
    }
  }

  downloadBlob(new Blob([code], { type: 'text/javascript' }), filename)
  return 'saved'
}

/**
 * Opens a JSON file via the native picker. Returns null if the user cancelled.
 */
export async function openJsonFile() {
  if (supportsFileSystemAccess) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      })
      const file = await handle.getFile()
      return JSON.parse(await file.text())
    } catch (error) {
      if (error?.name === 'AbortError') return null
      // NotAllowedError etc. — the native picker failed to even open, not
      // that the user declined. Let it propagate so the caller can fall
      // back to the <input type=file> picker instead of doing nothing.
      throw error
    }
  }
  throw new Error('File System Access API is not supported — use readJsonFromInputFile with a file input element instead.')
}

/** Fallback for browsers without File System Access API: parse a File from an <input type="file"> change event. */
export async function readJsonFromInputFile(file) {
  const text = await file.text()
  return JSON.parse(text)
}

/**
 * Opens a markdown file via the native picker and returns its raw text.
 * Returns null if the user cancelled.
 */
export async function openMarkdownFile() {
  if (supportsFileSystemAccess) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown file', accept: { 'text/markdown': ['.md', '.markdown'] } }],
        multiple: false,
      })
      const file = await handle.getFile()
      return file.text()
    } catch (error) {
      if (error?.name === 'AbortError') return null
      throw error
    }
  }
  throw new Error('File System Access API is not supported — use readTextFromInputFile with a file input element instead.')
}

/** Fallback for browsers without File System Access API: read raw text from an <input type="file"> change event. */
export async function readTextFromInputFile(file) {
  return file.text()
}