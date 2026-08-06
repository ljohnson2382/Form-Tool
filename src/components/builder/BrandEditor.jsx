import { useEffect, useState } from 'react'
import Card from '../common/Card'
import { deriveColorScale } from '../../utils/colorScale'

// Keeps an uploaded image's data URL well under Cosmos DB's 2MB per-document
// limit even with several fields set on the same brand — logos/favicons are
// tiny at this size, and a background photo just needs re-compressing first.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

const labelClass = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'

const DEFAULT_PICKER_COLOR = '#6366f1'

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

// A path/URL text field (for the existing "point at a file already in the
// project" workflow) paired with a real file picker — reads the chosen
// image into a data URL and writes it to the same field, same as typing a
// path, so a Project's images (see ProjectsPanel.jsx) can be uploaded at
// runtime instead of requiring a code change to add a file to the repo.
function ImageField({ label, value, onChange, placeholder, hint }) {
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`"${file.name}" is ${Math.round(file.size / 1024)}KB — keep uploads under ${Math.round(MAX_IMAGE_BYTES / 1024)}KB.`)
      return
    }
    setError('')
    onChange(await readFileAsDataUrl(file))
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input className={inputClass} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        <label className="flex shrink-0 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/60">
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {value && (
        <img
          src={value}
          alt=""
          className="mt-2 h-10 w-auto max-w-[140px] rounded border border-slate-200 object-contain dark:border-slate-700/50"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
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
export default function BrandEditor({
  brand,
  onChange,
  detectedBrands,
  savedProjects,
  onApplyProject,
  alwaysEnabled = false,
  appNamePlaceholder,
}) {
  const enabled = alwaysEnabled || Boolean(brand)
  const fields = fieldsFromBrand(brand)
  const pickerColor = brand?.colors?.[500] ?? DEFAULT_PICKER_COLOR

  // A free-typed draft, separate from pickerColor, so partial input (e.g.
  // "#3b8") isn't overwritten mid-keystroke by the last valid derived color
  // — synced back only when the brand's actual color changes from outside
  // (a preset, switching forms, clearing branding).
  const [accentText, setAccentText] = useState(pickerColor)
  useEffect(() => {
    setAccentText(pickerColor)
  }, [pickerColor])

  function updateField(key, value) {
    onChange({ ...(brand ?? {}), [key]: value })
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

  // A saved Project (see ProjectsPanel.jsx) is the same one-click apply as a
  // detected preset, plus onApplyProject — BuilderScreen.jsx uses that to
  // also link the form to the project (form.projectId), not just copy its
  // colors/images.
  function applyProject(project) {
    onChange(project.brand ? { ...project.brand } : null)
    onApplyProject?.(project)
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
          {savedProjects?.length > 0 && (
            <div className="sm:col-span-2">
              <p className={labelClass}>Your Projects</p>
              <div className="flex flex-wrap gap-2">
                {savedProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => applyProject(project)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  >
                    {project.brand?.colors?.[500] && (
                      <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: project.brand.colors[500] }} />
                    )}
                    {project.name}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Applies the project's branding to this form and links it to that project — still editable after. Manage projects
                from Global Settings.
              </p>
            </div>
          )}
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
              automatically (see <code>demo/src/assets/brands/itzipper/</code> for a working example), reference any image path or
              URL directly below, or use Upload to pick a file from your device.
            </p>
          </div>
          <ImageField
            label="Logo (light mode)"
            placeholder="/brands/acme/logo.svg"
            value={fields.logoLight}
            onChange={(value) => updateField('logoLight', value)}
          />
          <ImageField
            label="Logo (dark mode)"
            placeholder="Falls back to the light logo"
            value={fields.logoDark}
            onChange={(value) => updateField('logoDark', value)}
          />
          <div className="sm:col-span-2">
            <ImageField
              label="Favicon"
              placeholder="/brands/acme/favicon.svg"
              value={fields.favicon}
              onChange={(value) => updateField('favicon', value)}
              hint="Shown as the browser tab icon while this form is open."
            />
          </div>
          <ImageField
            label="Background (light mode)"
            placeholder="/brands/acme/background.png"
            value={fields.backgroundLight}
            onChange={(value) => updateField('backgroundLight', value)}
          />
          <ImageField
            label="Background (dark mode)"
            placeholder="/brands/acme/background-dark.png"
            value={fields.backgroundDark}
            onChange={(value) => updateField('backgroundDark', value)}
          />
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
