import Card from '../common/Card'
import { deriveColorScale } from '../../utils/colorScale'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

const labelClass = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'

const DEFAULT_PICKER_COLOR = '#6366f1'

function fieldsFromBrand(brand) {
  return {
    appName: brand?.appName ?? '',
    logoLight: brand?.logoLight ?? '',
    logoDark: brand?.logoDark ?? '',
    backgroundLight: brand?.backgroundLight ?? '',
    backgroundDark: brand?.backgroundDark ?? '',
    backgroundColorLight: brand?.backgroundColorLight ?? '',
    backgroundColorDark: brand?.backgroundColorDark ?? '',
    secondaryColor: brand?.secondaryColor ?? '',
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

  function updateField(key, value) {
    onChange({ ...(brand ?? {}), [key]: value })
  }

  function updateColor(hex) {
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
            backgroundLight: '',
            backgroundDark: '',
            backgroundColorLight: '',
            backgroundColorDark: '',
            secondaryColor: '',
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
              or URL directly below.
            </p>
          </div>
          <div>
            <label className={labelClass}>Logo (light mode)</label>
            <input
              className={inputClass}
              placeholder="/brands/acme/logo.svg"
              value={fields.logoLight}
              onChange={(e) => updateField('logoLight', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Logo (dark mode)</label>
            <input
              className={inputClass}
              placeholder="Falls back to the light logo"
              value={fields.logoDark}
              onChange={(e) => updateField('logoDark', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Background (light mode)</label>
            <input
              className={inputClass}
              placeholder="/brands/acme/background.png"
              value={fields.backgroundLight}
              onChange={(e) => updateField('backgroundLight', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Background (dark mode)</label>
            <input
              className={inputClass}
              placeholder="/brands/acme/background-dark.png"
              value={fields.backgroundDark}
              onChange={(e) => updateField('backgroundDark', e.target.value)}
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
            <input
              type="color"
              className="h-10 w-16 cursor-pointer rounded border border-slate-200 bg-white p-1 dark:border-slate-700/50 dark:bg-slate-800/40"
              value={pickerColor}
              onChange={(e) => updateColor(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fills primary buttons (Save, Submit).</p>
          </div>
          <ColorField
            label="Secondary button color"
            placeholder="Auto (derived from accent)"
            value={fields.secondaryColor}
            onChange={(value) => updateField('secondaryColor', value)}
          />
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sets the border/text for outline buttons (Preview, Cancel, Export). Left blank, it's derived from the accent color —
              set this directly if that auto-derived shade doesn't read well against your accent.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
