import { useEffect, useState } from 'react'
import Card from '../common/Card'
import { deriveColorScale } from '../../utils/colorScale'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

const labelClass = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'

const DEFAULT_PICKER_COLOR = '#6366f1'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

function fieldsFromBrand(brand) {
  return {
    appName: brand?.appName ?? '',
    logoLight: brand?.logoLight ?? '',
    logoDark: brand?.logoDark ?? '',
    favicon: brand?.favicon ?? '',
    backgroundLight: brand?.backgroundLight ?? '',
    backgroundDark: brand?.backgroundDark ?? '',
    backgroundColorLight: brand?.backgroundColorLight ?? '',
    backgroundColorDark: brand?.backgroundColorDark ?? '',
  }
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

// A hex text field (blank = unset, same as every other brand field here)
// paired with a native color-picker swatch as a convenience for typing one
// by hand — the two write to the same value, so either works.
function ColorField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input className={inputClass} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          type="color"
          aria-label={`Pick a color for ${label}`}
          className="h-10 w-10 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-1 dark:border-slate-700/50 dark:bg-slate-800/40"
          value={HEX_COLOR.test(value) ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ImageField({ label, value, placeholder, fieldKey, onChange, onUpload, uploadState, uploadError, hint }) {
  const busy = uploadState === fieldKey

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-800/60 ${
            busy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {busy ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(fieldKey, file)
              // Allow selecting the same file again after replacing/removing.
              e.target.value = ''
            }}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
          onClick={() => onChange('')}
          disabled={!value || busy}
        >
          Clear
        </button>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      {uploadError ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{uploadError}</p> : null}
    </div>
  )
}

/**
 * One color input rather than the full 50–900 scale a brand config actually
 * needs — deriveColorScale fills the rest. See src/utils/colorScale.js.
 *
 * `alwaysEnabled` skips the "Customize branding" checkbox and treats the
 * panel as permanently on — for AdminSettingsScreen.jsx, the one context
 * where there's no "inherit vs. override" choice, just direct editing of
 * the app's own default brand.
 */
export default function BrandEditor({ brand, onChange, detectedBrands, alwaysEnabled = false, appNamePlaceholder }) {
  const enabled = alwaysEnabled || Boolean(brand)
  const fields = fieldsFromBrand(brand)
  const pickerColor = brand?.colors?.[500] ?? DEFAULT_PICKER_COLOR
  const [uploadingField, setUploadingField] = useState(null)
  const [uploadErrors, setUploadErrors] = useState({})

  // A free-typed draft, separate from pickerColor, so partial input (e.g.
  // "#3b8") isn't overwritten mid-keystroke by the last valid derived color
  // — synced back only when the brand's actual color changes from outside
  // (a preset, switching forms, clearing branding).
  const [accentText, setAccentText] = useState(pickerColor)
  useEffect(() => {
    setAccentText(pickerColor)
  }, [pickerColor])

  function updateField(key, value) {
    setUploadErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    onChange({ ...(brand ?? {}), [key]: value })
  }

  async function uploadFieldImage(key, file) {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      setUploadErrors((prev) => ({ ...prev, [key]: 'Please choose an image file.' }))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadErrors((prev) => ({ ...prev, [key]: `Image is ${formatBytes(file.size)}. Max allowed is ${formatBytes(MAX_IMAGE_BYTES)}.` }))
      return
    }

    setUploadingField(key)
    setUploadErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    try {
      const dataUrl = await readFileAsDataUrl(file)
      onChange({ ...(brand ?? {}), [key]: dataUrl })
    } catch (err) {
      setUploadErrors((prev) => ({ ...prev, [key]: err?.message || 'Could not upload that image.' }))
    } finally {
      setUploadingField(null)
    }
  }

  function updateColor(hex) {
    setAccentText(hex)
    const colors = deriveColorScale(hex)
    if (colors) onChange({ ...(brand ?? {}), colors })
  }

  function toggle(e) {
    onChange(
      e.target.checked
        ? {
            appName: '',
            logoLight: '',
            logoDark: '',
            favicon: '',
            backgroundLight: '',
            backgroundDark: '',
            backgroundColorLight: '',
            backgroundColorDark: '',
            colors: {},
          }
        : null,
    )
  }

  // Applies every field from a detected preset at once — same onChange path
  // as a manual edit, so nothing about it is locked in; typing over any
  // field afterward overrides just that one.
  function applyPreset(preset) {
    onChange({ ...preset.brand })
  }

  return (
    <Card>
      {!alwaysEnabled && (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
          <input type="checkbox" checked={enabled} onChange={toggle} />
          Customize branding for this form
        </label>
      )}

      {!enabled ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This form uses the app's default look. Turn this on to give it its own logo, background, and accent color — shown to
          respondents filling it out, and while you're editing or previewing it here.
        </p>
      ) : (
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${alwaysEnabled ? '' : 'mt-3'}`}>
          {detectedBrands?.length > 0 && (
            <div className="sm:col-span-2">
              <p className={labelClass}>Detected in this project</p>
              <div className="flex flex-wrap gap-2">
                {detectedBrands.map((preset) => (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  >
                    {preset.brand.colors?.[500] && (
                      <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.brand.colors[500] }} />
                    )}
                    {preset.brand.appName || preset.slug}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">One click fills in every field below — still editable after.</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={labelClass}>App name</label>
            <input
              className={inputClass}
              placeholder={appNamePlaceholder ?? "Inherit the app's default"}
              value={fields.appName}
              onChange={(e) => updateField('appName', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add an image to this project's <code>src/assets/brands/&lt;name&gt;/</code> folder to have it show up above
              automatically (see <code>demo/src/assets/brands/itzipper/</code> for a working example), or reference any image path
              or URL directly below. You can also upload an image file; it will be stored with this form's brand data.
            </p>
          </div>
          <div>
            <ImageField
              label="Logo (light mode)"
              placeholder="/brands/acme/logo.svg"
              value={fields.logoLight}
              fieldKey="logoLight"
              onChange={(value) => updateField('logoLight', value)}
              onUpload={uploadFieldImage}
              uploadState={uploadingField}
              uploadError={uploadErrors.logoLight}
              hint="If dark-mode logo is blank, this light logo is used there too."
            />
          </div>
          <div>
            <ImageField
              label="Logo (dark mode)"
              placeholder="Falls back to the light logo"
              value={fields.logoDark}
              fieldKey="logoDark"
              onChange={(value) => updateField('logoDark', value)}
              onUpload={uploadFieldImage}
              uploadState={uploadingField}
              uploadError={uploadErrors.logoDark}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Favicon"
              placeholder="/brands/acme/favicon.svg"
              value={fields.favicon}
              fieldKey="favicon"
              onChange={(value) => updateField('favicon', value)}
              onUpload={uploadFieldImage}
              uploadState={uploadingField}
              uploadError={uploadErrors.favicon}
              hint="Shown as the browser tab icon while this form is open."
            />
          </div>
          <div>
            <ImageField
              label="Background (light mode)"
              placeholder="/brands/acme/background.png"
              value={fields.backgroundLight}
              fieldKey="backgroundLight"
              onChange={(value) => updateField('backgroundLight', value)}
              onUpload={uploadFieldImage}
              uploadState={uploadingField}
              uploadError={uploadErrors.backgroundLight}
            />
          </div>
          <div>
            <ImageField
              label="Background (dark mode)"
              placeholder="/brands/acme/background-dark.png"
              value={fields.backgroundDark}
              fieldKey="backgroundDark"
              onChange={(value) => updateField('backgroundDark', value)}
              onUpload={uploadFieldImage}
              uploadState={uploadingField}
              uploadError={uploadErrors.backgroundDark}
            />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A solid background color, independent of the image fields above — set one, the other, both (image shows over the
              color), or neither for the default look.
            </p>
          </div>
          <ColorField
            label="Background color (light mode)"
            placeholder="e.g. #f8fafc"
            value={fields.backgroundColorLight}
            onChange={(value) => updateField('backgroundColorLight', value)}
          />
          <ColorField
            label="Background color (dark mode)"
            placeholder="e.g. #0f172a"
            value={fields.backgroundColorDark}
            onChange={(value) => updateField('backgroundColorDark', value)}
          />
          <div>
            <label className={labelClass}>Accent color</label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="e.g. #6366f1"
                value={accentText}
                onChange={(e) => updateColor(e.target.value)}
              />
              <input
                type="color"
                aria-label="Pick an accent color"
                className="h-10 w-10 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-1 dark:border-slate-700/50 dark:bg-slate-800/40"
                value={HEX_COLOR.test(accentText) ? accentText : '#ffffff'}
                onChange={(e) => updateColor(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fills primary buttons (Save, Submit).</p>
          </div>
        </div>
      )}
    </Card>
  )
}
