// Best-effort markdown -> form converter. There's no standard grammar for
// "survey written as markdown", so this applies the same conventions a
// human transcribing a survey doc tends to use:
//   # Title                          -> form title
//   (paragraphs before first list)   -> form/section description
//   ## Heading                       -> new section
//   ### Heading  /  **Bold Line**    -> non-answerable section_header item
//     (a sub-grouping inside a section, not a new section)
//   1. Question text                 -> answerable item (type inferred below)
//   - Task: description text         -> section_header item (moderator script,
//                                        not something a respondent answers)
//
// Type inference is pattern-based, not semantic — it catches the markers a
// document typically already uses to signal answer shape (a Pass/Fail
// bracket, a numeric range, a slash-separated option list). Anything that
// doesn't match a pattern becomes a plain text question. Treat the result as
// a first draft: open it in the Builder and fix any misclassified items.

import { marked } from 'marked'
import { QUESTION_TYPES, createId, createSection, createEmptyForm } from '../data/formSchema.js'

const PASS_FAIL_PREFIX = /^\[\s*Pass\s*\/\s*Fail\s*\]\s*/i
const YES_NO_MARKER = /\(\s*Yes\s*\/\s*No\s*\)/i
const RANGE_WITH_LABELS = /\((\d+)\s*=\s*([^,)]+?)\s*,\s*(\d+)\s*=\s*([^)]+?)\)/
const RANGE_PLAIN = /\((\d+)\s*-\s*(\d+)(?:\s*each)?\)/
const SLASH_OPTIONS = /\(([^()]*\/[^()]+)\)/ // one or more slashes -> 2+ options
const BOLD_ONLY_LINE = /^\*\*(.+)\*\*$/
const TASK_PREFIX = /^task\s/i

const LIST_ITEM_LINE = /^\s*(?:\d+\.|[-*+])\s/

// CommonMark: an ordered list can only interrupt a directly preceding
// paragraph if it starts at 1 — "31. ..." right after a text line (no blank
// line between them) parses as part of that paragraph, not a list. Survey
// docs routinely continue numbering (a bold pseudo-heading immediately
// followed by "31. ...") without a blank line, so without this normalization
// pass those items silently vanish into the surrounding paragraph text.
function ensureBlankLineBeforeListItems(markdownText) {
  const lines = markdownText.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prev = result[result.length - 1]
    if (LIST_ITEM_LINE.test(line) && prev !== undefined && prev.trim() !== '' && !LIST_ITEM_LINE.test(prev)) {
      result.push('')
    }
    result.push(line)
  }
  return result.join('\n')
}

function stripInlineMarkup(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim()
}

function inferItemFromText(rawText) {
  const text = stripInlineMarkup(rawText)

  const passFailMatch = text.match(PASS_FAIL_PREFIX)
  if (passFailMatch) {
    return { type: QUESTION_TYPES.PASS_FAIL, text: text.slice(passFailMatch[0].length).trim(), allowNotes: true }
  }

  if (TASK_PREFIX.test(text)) {
    // Moderator-run task scripts describe what to do, not something the
    // respondent answers directly.
    return { type: QUESTION_TYPES.SECTION_HEADER, text }
  }

  const rangeWithLabels = text.match(RANGE_WITH_LABELS)
  if (rangeWithLabels) {
    const [, min, minLabel, max, maxLabel] = rangeWithLabels
    return {
      type: QUESTION_TYPES.RATING_SCALE,
      text,
      scale: { min: Number(min), max: Number(max), minLabel: minLabel.trim(), maxLabel: maxLabel.trim() },
    }
  }

  const rangePlain = text.match(RANGE_PLAIN)
  if (rangePlain) {
    const [, min, max] = rangePlain
    return { type: QUESTION_TYPES.RATING_SCALE, text, scale: { min: Number(min), max: Number(max), minLabel: '', maxLabel: '' } }
  }

  if (YES_NO_MARKER.test(text)) {
    return { type: QUESTION_TYPES.YES_NO, text }
  }

  const slashOptions = text.match(SLASH_OPTIONS)
  if (slashOptions) {
    const options = slashOptions[1].split('/').map((o) => o.trim()).filter(Boolean)
    if (options.length >= 2) {
      return { type: QUESTION_TYPES.MULTIPLE_CHOICE, text, options }
    }
  }

  return { type: text.length > 80 ? QUESTION_TYPES.LONG_TEXT : QUESTION_TYPES.SHORT_TEXT, text }
}

function buildItem(inferred) {
  const base = { id: createId('item'), required: false, hint: '' }
  switch (inferred.type) {
    case QUESTION_TYPES.SECTION_HEADER:
      return { ...base, type: inferred.type, text: inferred.text }
    case QUESTION_TYPES.RATING_SCALE:
      return { ...base, type: inferred.type, text: inferred.text, scale: inferred.scale }
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return { ...base, type: inferred.type, text: inferred.text, options: inferred.options }
    case QUESTION_TYPES.PASS_FAIL:
      return { ...base, type: inferred.type, text: inferred.text, allowNotes: inferred.allowNotes }
    default:
      return { ...base, type: inferred.type, text: inferred.text, placeholder: '' }
  }
}

export function parseMarkdownToForm(markdownText, { title: fallbackTitle = 'Imported Form' } = {}) {
  const tokens = marked.lexer(ensureBlankLineBeforeListItems(markdownText))
  const form = createEmptyForm(fallbackTitle)
  form.sections = []

  let titleSet = false
  let currentSection = null
  const descriptionParts = { form: [], section: [] }

  function flushSectionDescription() {
    if (currentSection && descriptionParts.section.length > 0) {
      currentSection.description = descriptionParts.section.join(' ').trim()
      descriptionParts.section = []
    }
  }

  function ensureSection(headingText) {
    flushSectionDescription()
    currentSection = createSection(headingText)
    form.sections.push(currentSection)
  }

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1 && !titleSet) {
      form.title = stripInlineMarkup(token.text)
      titleSet = true
      continue
    }

    if (token.type === 'heading' && token.depth <= 2) {
      ensureSection(stripInlineMarkup(token.text))
      continue
    }

    if (token.type === 'heading' && token.depth >= 3) {
      // Front matter (a subtitle heading before any real ## section) reads
      // as part of the form's description, not a section of its own.
      if (!currentSection) {
        descriptionParts.form.push(stripInlineMarkup(token.text))
        continue
      }
      flushSectionDescription()
      currentSection.items.push(buildItem({ type: QUESTION_TYPES.SECTION_HEADER, text: stripInlineMarkup(token.text) }))
      continue
    }

    if (token.type === 'paragraph') {
      const boldOnly = token.text.trim().match(BOLD_ONLY_LINE)
      if (!currentSection) {
        if (boldOnly) {
          ensureSection(stripInlineMarkup(boldOnly[1]))
        } else if (!titleSet || form.sections.length === 0) {
          descriptionParts.form.push(stripInlineMarkup(token.text))
        }
        continue
      }
      if (boldOnly && currentSection.items.length > 0) {
        flushSectionDescription()
        currentSection.items.push(buildItem({ type: QUESTION_TYPES.SECTION_HEADER, text: stripInlineMarkup(boldOnly[1]) }))
      } else if (currentSection.items.length === 0) {
        descriptionParts.section.push(stripInlineMarkup(token.text))
      }
      continue
    }

    if (token.type === 'list') {
      // A list before any real ## section is front matter (e.g. an intro
      // "stages run in this order" summary), not actual question content.
      if (!currentSection) {
        token.items.forEach((listItem) => descriptionParts.form.push(stripInlineMarkup(listItem.text.split('\n')[0])))
        continue
      }
      flushSectionDescription()
      token.items.forEach((listItem, index) => {
        const raw = listItem.text.split('\n')[0]
        // Classify against the raw text first — pattern anchors like the
        // "[ Pass / Fail ]" prefix check the start of the string, which a
        // prepended "73. " would otherwise shadow. Number the result after.
        const inferred = inferItemFromText(raw)
        if (token.ordered) {
          inferred.text = `${token.start + index}. ${inferred.text}`
        }
        currentSection.items.push(buildItem(inferred))
      })
    }
  }

  flushSectionDescription()
  if (descriptionParts.form.length > 0) {
    form.description = descriptionParts.form.join(' ').trim()
  }
  if (form.sections.length === 0) {
    form.sections.push(createSection('Section 1'))
  }

  return form
}
