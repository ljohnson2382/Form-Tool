import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import BrandEditor from '../components/builder/BrandEditor'
import { getAppBrand, saveAppBrand } from '../utils/appSettings'

/**
 * The admin app's own default look — logo, background, accent color shown
 * on the Dashboard and any form that hasn't customized its own. Separate
 * from a form's branding (BrandEditor is reused, just with `alwaysEnabled`
 * — there's no "inherit vs. override" toggle here, this *is* the default).
 */
export default function AdminSettingsScreen({ onBack, onSaved, detectedBrands }) {
  const [brand, setBrand] = useState(null)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved

  useEffect(() => {
    getAppBrand().then((stored) => setBrand(stored ?? {}))
  }, [])

  async function handleSave() {
    setSaveState('saving')
    const saved = await saveAppBrand(brand)
    onSaved?.(saved)
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 1500)
  }

  if (!brand) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading settings…</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          {saveState === 'saved' && <span className="text-sm text-slate-500 dark:text-slate-400">Saved</span>}
          <Button onClick={handleSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The admin app's own default look — shown on the Dashboard and any form that hasn't customized its own branding.
        </p>
      </div>

      <BrandEditor
        brand={brand}
        onChange={setBrand}
        alwaysEnabled
        appNamePlaceholder="e.g. Form Designer"
        detectedBrands={detectedBrands}
      />
    </div>
  )
}
