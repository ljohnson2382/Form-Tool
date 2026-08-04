import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

/**
 * Shown right after a successful Publish/Update — the whole point is
 * getting the shareable fill link into your hands at the moment you'd
 * actually want it, instead of hunting for "Copy link" in a menu
 * afterward. `url` is null when closed (controls the Modal's `open`).
 */
export default function PublishedLinkModal({ url, onClose }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked by the browser — the link is still
      // right there in the input to select and copy by hand.
    }
  }

  return (
    <Modal open={Boolean(url)} onClose={onClose} title="Published">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Share this link with whoever should fill it out.</p>
      <div className="flex gap-2">
        <input className={inputClass} readOnly value={url ?? ''} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  )
}
