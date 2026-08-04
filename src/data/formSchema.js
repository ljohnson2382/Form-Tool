export const QUESTION_TYPES = {
  SECTION_HEADER: 'section_header',
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  YES_NO: 'yes_no',
  MULTIPLE_CHOICE: 'multiple_choice',
  RATING_SCALE: 'rating_scale',
  PASS_FAIL: 'pass_fail',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SECTION_HEADER]: 'Section Header',
  [QUESTION_TYPES.SHORT_TEXT]: 'Short Answer',
  [QUESTION_TYPES.LONG_TEXT]: 'Paragraph',
  [QUESTION_TYPES.YES_NO]: 'Yes / No',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.RATING_SCALE]: 'Rating Scale',
  [QUESTION_TYPES.PASS_FAIL]: 'Pass / Fail',
}

function randomToken() {
  const webCrypto = globalThis.crypto
  if (webCrypto?.randomUUID) return webCrypto.randomUUID()
  if (webCrypto?.getRandomValues) {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Last resort for environments without WebCrypto at all. Math.random is not
  // unguessable — fine while IDs are only local database keys, but anything
  // that turns an ID into a shareable link needs the branches above.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createId(prefix = 'id') {
  return `${prefix}-${randomToken()}`
}

// Upper bound on how many buttons one rating scale may render. This exists so
// a malformed import or a fat-fingered Max field (1000000000) can't ask the
// browser to build a billion-element array and hang the tab. It's a safety
// valve rather than a survey-design opinion, so it sits well above any real
// scale — 0-10 NPS, the widest in normal use, needs 11.
export const MAX_SCALE_POINTS = 51

const DEFAULT_SCALE = { min: 1, max: 5, minLabel: '', maxLabel: '' }

function toInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

function toText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

/**
 * Always returns a scale that can be rendered, whatever shape came in —
 * missing entirely, non-numeric, inverted, or absurdly wide. Call this at
 * every point a scale is about to be rendered or persisted so the render
 * path never has to trust stored data.
 */
export function normalizeScale(scale) {
  const source = scale && typeof scale === 'object' ? scale : DEFAULT_SCALE
  const min = toInteger(source.min, DEFAULT_SCALE.min)
  let max = toInteger(source.max, DEFAULT_SCALE.max)
  if (max < min) max = min
  if (max - min + 1 > MAX_SCALE_POINTS) max = min + MAX_SCALE_POINTS - 1
  return { min, max, minLabel: toText(source.minLabel), maxLabel: toText(source.maxLabel) }
}

/** Options as a clean array of strings, whatever was stored. */
export function normalizeOptions(options) {
  return Array.isArray(options) ? options.filter((option) => typeof option === 'string') : []
}

const BRAND_COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

function toNullableText(value) {
  return typeof value === 'string' && value.trim() ? value : null
}

/**
 * A form's own optional custom brand (same shape as the app-level brand
 * config in BrandContext.jsx) — same "repair, don't throw" style as
 * normalizeScale/normalizeOptions. A brand with nothing meaningful set
 * normalizes to `null`, which is the same as the form not having one.
 */
export function normalizeBrand(brand) {
  if (!brand || typeof brand !== 'object') return null

  const colorsSource = brand.colors && typeof brand.colors === 'object' ? brand.colors : {}
  const colors = {}
  for (const shade of BRAND_COLOR_SHADES) {
    const value = colorsSource[shade]
    if (typeof value === 'string' && value.trim()) colors[shade] = value
  }

  const normalized = {
    appName: toNullableText(brand.appName),
    logoLight: toNullableText(brand.logoLight),
    logoDark: toNullableText(brand.logoDark),
    backgroundLight: toNullableText(brand.backgroundLight),
    backgroundDark: toNullableText(brand.backgroundDark),
    // A solid fill, independent of the image fields above — see
    // PageBackground.jsx for how the two combine.
    backgroundColorLight: toNullableText(brand.backgroundColorLight),
    backgroundColorDark: toNullableText(brand.backgroundColorDark),
    colors,
  }

  const hasAnything = Object.values(normalized).some((value) => (value && typeof value === 'object' ? Object.keys(value).length > 0 : value !== null))
  return hasAnything ? normalized : null
}

/** Safe accessors so a malformed record degrades to "empty" instead of throwing mid-render. */
export function sectionsOf(form) {
  return Array.isArray(form?.sections) ? form.sections : []
}

export function itemsOf(section) {
  return Array.isArray(section?.items) ? section.items : []
}

export function createItem(type) {
  const base = { id: createId('item'), type, text: '', required: false, hint: '' }
  switch (type) {
    case QUESTION_TYPES.SECTION_HEADER:
      return { ...base, text: 'New Section Header' }
    case QUESTION_TYPES.SHORT_TEXT:
    case QUESTION_TYPES.LONG_TEXT:
      return { ...base, placeholder: '' }
    case QUESTION_TYPES.YES_NO:
      return base
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return { ...base, options: ['Option 1', 'Option 2'] }
    case QUESTION_TYPES.RATING_SCALE:
      return { ...base, scale: { ...DEFAULT_SCALE } }
    case QUESTION_TYPES.PASS_FAIL:
      return { ...base, allowNotes: true }
    default:
      return base
  }
}

export function createSection(title = 'New Section') {
  return { id: createId('section'), title, description: '', items: [] }
}

export function createEmptyForm(title = 'Untitled Form') {
  const now = new Date().toISOString()
  return {
    id: createId('form'),
    title,
    description: '',
    projectId: null,
    audience: null,
    seriesId: null,
    seriesIndex: null,
    seriesTotal: null,
    nextFormId: null,
    createdAt: now,
    updatedAt: now,
    sections: [createSection('Section 1')],
    brand: null,
  }
}

export function isAnswerable(item) {
  return item?.type !== QUESTION_TYPES.SECTION_HEADER
}

export function countQuestions(form) {
  return sectionsOf(form).reduce((sum, section) => sum + itemsOf(section).filter(isAnswerable).length, 0)
}

function isEmptyValue(item, value) {
  if (item.type === QUESTION_TYPES.PASS_FAIL) {
    return !value || !value.result
  }
  return value === undefined || value === null || value === ''
}

export function validateResponses(form, answers) {
  const errors = {}
  for (const section of sectionsOf(form)) {
    for (const item of itemsOf(section)) {
      if (!isAnswerable(item) || !item.required) continue
      if (isEmptyValue(item, answers[item.id])) {
        errors[item.id] = 'This field is required.'
      }
    }
  }
  return errors
}
