// A small, fully fictional example seed — enough sections and question
// types to exercise the Builder, branding, and Fill surfaces without
// depending on any real client's content.

import { QUESTION_TYPES, createId } from 'form-builder-kit'

function item(type, text, extra = {}) {
  return { id: createId('item'), type, text, required: false, hint: '', ...extra }
}

export const sampleFeedbackSurvey = {
  id: 'sample-feedback-survey',
  title: 'Product Feedback Survey',
  description: 'A short example survey used to demo the Builder, branding, and Fill screens.',
  projectId: null,
  audience: null,
  seriesId: null,
  seriesIndex: null,
  seriesTotal: null,
  nextFormId: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  sections: [
    {
      id: createId('section'),
      title: 'About you',
      description: '',
      items: [
        item(QUESTION_TYPES.SHORT_TEXT, 'What best describes your role?', { required: true }),
        item(QUESTION_TYPES.MULTIPLE_CHOICE, 'How often do you use the product?', {
          required: true,
          options: ['Daily', 'A few times a week', 'A few times a month', 'Rarely'],
        }),
      ],
    },
    {
      id: createId('section'),
      title: 'Your experience',
      description: '',
      items: [
        item(QUESTION_TYPES.RATING_SCALE, 'How satisfied are you overall?', { required: true }),
        item(QUESTION_TYPES.YES_NO, 'Would you recommend it to a colleague?'),
        item(QUESTION_TYPES.LONG_TEXT, 'What could be improved?', {
          hint: 'Be as specific as you like.',
        }),
      ],
    },
  ],
  brand: null,
}
