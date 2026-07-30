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

function downloadJson(data, suggestedName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
      throw error
    }
  }

  downloadJson(data, filename)
  return 'saved'
}

export function suggestedFormFilename(form) {
  return `${slugifyFilename(form.title)}.form.json`
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
