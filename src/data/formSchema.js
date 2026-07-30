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

export function createId(prefix = 'id') {
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${uuid}`
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
      return { ...base, scale: { min: 1, max: 5, minLabel: '', maxLabel: '' } }
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
    createdAt: now,
    updatedAt: now,
    sections: [createSection('Section 1')],
  }
}

export function isAnswerable(item) {
  return item.type !== QUESTION_TYPES.SECTION_HEADER
}

export function countQuestions(form) {
  return form.sections.reduce((sum, section) => sum + section.items.filter(isAnswerable).length, 0)
}

function isEmptyValue(item, value) {
  if (item.type === QUESTION_TYPES.PASS_FAIL) {
    return !value || !value.result
  }
  return value === undefined || value === null || value === ''
}

export function validateResponses(form, answers) {
  const errors = {}
  for (const section of form.sections) {
    for (const item of section.items) {
      if (!isAnswerable(item) || !item.required) continue
      if (isEmptyValue(item, answers[item.id])) {
        errors[item.id] = 'This field is required.'
      }
    }
  }
  return errors
}
