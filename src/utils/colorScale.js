// Derives a Tailwind-style 50–900 lightness ramp from a single input color,
// so the Builder's one-color-picker branding control produces a cohesive
// theme instead of asking for ten hex values by hand. Hue/saturation stay
// fixed; only lightness walks per shade, anchored so the input color lands
// near the 500 step.

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() ?? '')
  if (!match) return null
  return match.slice(1).map((part) => parseInt(part, 16))
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / d) % 6
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s]
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const LIGHTNESS_RAMP = {
  50: 0.96,
  100: 0.91,
  200: 0.82,
  300: 0.7,
  400: 0.6,
  500: 0.5,
  600: 0.42,
  700: 0.34,
  800: 0.26,
  900: 0.18,
}

/** Returns a full { 50: '#...', ..., 900: '#...' } scale, or null for an unparseable hex. */
export function deriveColorScale(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [h, s] = rgbToHsl(...rgb)
  const scale = {}
  for (const [shade, lightness] of Object.entries(LIGHTNESS_RAMP)) {
    scale[shade] = hslToHex(h, s, lightness)
  }
  return scale
}
