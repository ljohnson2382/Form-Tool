// Everything entering the form store passes through here, so the render path
// never has to trust stored data. Imported JSON is arbitrary file content —
// before this existed, a single missing key (`sections`, `items`, an item's
// `scale`) threw during render, and because the record was persisted *before*
// the re-render, the crash repeated on every reload with no UI left to delete
// the offending form.

import { QUESTION_TYPES, createId, normalizeScale, normalizeOptions, normalizeBrand } from './formSchema.js'

export class FormValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FormValidationError'
  }
}

const KNOWN_TYPES = new Set(Object.values(QUESTION_TYPES))

function toText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

// A form with no project set is a real, valid state (a draft that hasn't
// been organized yet) — unlike the other text fields here, empty means
// "unset" rather than "blank string", so this normalizes to `null` instead
// of `''`. Same shape as formSchema.js's own toNullableText, used for the
// optional brand fields.
function toNullableText(value) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toNullableInteger(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null

  // An unrecognized type would hit no branch in QuestionField and render as a
  // silently blank question; a plain text input at least stays answerable.
  const type = KNOWN_TYPES.has(item.type) ? item.type : QUESTION_TYPES.SHORT_TEXT

  const base = {
    id: toText(item.id) || createId('item'),
    type,
    text: toText(item.text),
    required: item.required === true,
    hint: toText(item.hint),
  }

  switch (type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return { ...base, options: normalizeOptions(item.options) }
    case QUESTION_TYPES.RATING_SCALE:
      return { ...base, scale: normalizeScale(item.scale) }
    case QUESTION_TYPES.PASS_FAIL:
      return { ...base, allowNotes: item.allowNotes !== false }
    case QUESTION_TYPES.SHORT_TEXT:
    case QUESTION_TYPES.LONG_TEXT:
      return { ...base, placeholder: toText(item.placeholder) }
    default:
      return base
  }
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') return null
  return {
    id: toText(section.id) || createId('section'),
    title: toText(section.title, 'Untitled Section'),
    description: toText(section.description),
    items: (Array.isArray(section.items) ? section.items : []).map(normalizeItem).filter(Boolean),
  }
}

/**
 * Brings an arbitrary value into the exact shape every screen assumes.
 *
 * `strict: true` (the import gate) rejects anything that isn't recognizably a
 * form export, so the user gets a clear "this isn't a form file" message
 * instead of an empty form appearing for no reason.
 *
 * `strict: false` (reads and writes) repairs rather than throws, so a record
 * already sitting in IndexedDB from an older build — or one written before
 * this validation existed — still lists and can still be opened or deleted.
 *
 * Note this drops properties outside the documented schema. That's deliberate
 * at the storage boundary: it keeps what's persisted to a known shape.
 */
export function normalizeForm(raw, { strict = false } = {}) {
  const now = new Date().toISOString()
  const isPlainObject = raw && typeof raw === 'object' && !Array.isArray(raw)

  if (!isPlainObject) {
    if (strict) throw new FormValidationError('That file doesn’t contain a form — expected a JSON object.')
    return { id: createId('form'), title: 'Unreadable form', description: '', createdAt: now, updatedAt: now, sections: [], brand: null }
  }

  if (strict) {
    if (typeof raw.title !== 'string') {
      throw new FormValidationError('That file has no "title", so it doesn’t look like a form export.')
    }
    if (!Array.isArray(raw.sections)) {
      throw new FormValidationError('That file has no "sections" list, so it doesn’t look like a form export.')
    }
  }

  return {
    id: toText(raw.id) || createId('form'),
    title: toText(raw.title, 'Untitled Form'),
    description: toText(raw.description),
    projectId: toNullableText(raw.projectId),
    // Who this form is for (e.g. "Participant", "Moderator", "Stakeholder")
    // — freeform, not an enum, so it stays generic across clients. Also
    // what DashboardScreen.jsx's grouping uses and what "Split into Stages"
    // (BuilderScreen.jsx) assigns per resulting stage.
    audience: toNullableText(raw.audience),
    // Set only on forms produced by "Split into Stages" — link a stage to
    // the guided sequence it belongs to. seriesIndex/seriesTotal count only
    // the stages sharing this form's audience (see BuilderScreen.jsx);
    // nextFormId is null for the last stage in that audience's chain, or
    // any stage that's the only one for its audience.
    seriesId: toNullableText(raw.seriesId),
    seriesIndex: toNullableInteger(raw.seriesIndex),
    seriesTotal: toNullableInteger(raw.seriesTotal),
    nextFormId: toNullableText(raw.nextFormId),
    createdAt: toText(raw.createdAt) || now,
    updatedAt: toText(raw.updatedAt) || now,
    sections: (Array.isArray(raw.sections) ? raw.sections : []).map(normalizeSection).filter(Boolean),
    brand: normalizeBrand(raw.brand),
  }
}
