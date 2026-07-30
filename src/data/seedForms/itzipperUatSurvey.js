// The full ITZipper UAT & Usability testing survey suite (8 stages, 95 items),
// pre-seeded as the first form so the app is never empty on first load.
// Content transcribed in full from the source program document — nothing
// dropped. Stage 3 (moderator-run task script) is represented as
// non-answerable section_header items grouped by task category; Stage 4's
// micro-survey questions are the answerable block a moderator repeats after
// each task.

import { QUESTION_TYPES, createId } from '../formSchema'

function header(text) {
  return { id: createId('item'), type: QUESTION_TYPES.SECTION_HEADER, text, required: false, hint: '' }
}

function shortText(text, { required = false, hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.SHORT_TEXT, text, required, hint, placeholder: '' }
}

function longText(text, { required = false, hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.LONG_TEXT, text, required, hint, placeholder: '' }
}

function yesNo(text, { required = false, hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.YES_NO, text, required, hint }
}

function multipleChoice(text, options, { required = false, hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.MULTIPLE_CHOICE, text, required, hint, options }
}

function rating(text, { min = 1, max = 5, minLabel = '', maxLabel = '', required = false, hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.RATING_SCALE, text, required, hint, scale: { min, max, minLabel, maxLabel } }
}

function passFail(text, { hint = '' } = {}) {
  return { id: createId('item'), type: QUESTION_TYPES.PASS_FAIL, text, required: false, hint, allowNotes: true }
}

function section(title, description, items) {
  return { id: createId('section'), title, description, items }
}

const stage1 = section('STAGE 1: Pre-Test Screener (Participant Intake)', 'Purpose: segment results by who’s testing, before they see the product.', [
  shortText('1. What certification(s) are you currently studying for or interested in?', { required: true }),
  longText('2. Have you used any other exam-prep or study platform before (e.g., Quizlet, Anki, ExamCompass, Udemy)? Which ones?'),
  rating('3. How would you rate your overall comfort with technology/apps?', { min: 1, max: 5, minLabel: 'Not comfortable', maxLabel: 'Very comfortable' }),
  multipleChoice('4. What device will you primarily use for this test?', ['Desktop', 'Laptop', 'Tablet', 'Phone']),
  shortText('5. What browser will you be using?'),
  longText('6. Do you use any assistive technology (screen reader, screen magnifier, voice control, switch device)? If yes, which?'),
  yesNo('7. Do you have any color-vision deficiency (color blindness)?'),
  multipleChoice('8. Do you currently use dark mode or light mode as your OS/app default?', ['Dark mode', 'Light mode', 'Not sure']),
  shortText('9. On a typical week, how much time do you spend studying for certifications?'),
  yesNo('10. Have you ever used ITZipper or seen it before today?'),
])

const stage2 = section(
  'STAGE 2: Pre-Task Expectations Survey',
  'Purpose: capture what the tester expects before touching the app, so you can compare expectation vs. reality later.',
  [
    longText('11. Based on the name and description alone, what do you think ITZipper does?'),
    yesNo('12. Do you expect to need to create an account or log in to use it?'),
    yesNo('13. Do you expect your study progress to be saved automatically, and to follow you across devices?'),
    multipleChoice('14. Do you expect the app to be free, one-time purchase, or subscription-based?', [
      'Free',
      'One-time purchase',
      'Subscription-based',
      'Not sure',
    ]),
    longText('15. What would make you trust a study platform’s practice exam scores as realistic?'),
  ],
)

function taskGroup(letter, title, tasks) {
  return [header(`${letter}. ${title}`), ...tasks.map((t) => header(t))]
}

const stage3 = section(
  'STAGE 3: Task-Based UAT Script',
  'Moderator gives the tester one task at a time, observes silently, and records: Completed / Completed with difficulty / Failed, time-on-task, and number of errors/wrong turns. After each task, run the Stage 4 micro-survey.',
  [
    ...taskGroup('A', 'Catalog & Enrollment', [
      'Task A1: Find and enroll in a certification of your choice from the Home screen.',
      'Task A2: Return to Home and confirm the cert now shows "Continue" instead of "Enroll."',
      'Task A3: Locate the pricing information and explain in your own words what you’d be paying for.',
    ]),
    ...taskGroup('B', 'Navigation', [
      'Task B1: Switch from your enrolled cert to a different certification using the cert switcher.',
      'Task B2: From any screen, return to the Home screen.',
      'Task B3: Refresh the browser tab and report what happened.',
    ]),
    ...taskGroup('C', 'Learn Mode', [
      'Task C1: Open Learn mode for a specific domain and find the "Visual Context" images.',
      'Task C2: Locate the "How The Ideas Connect" diagram and describe what it’s showing.',
    ]),
    ...taskGroup('D', 'Study Mode', [
      'Task D1: Open Study mode for a domain and add a personal note to one section.',
      'Task D2: Navigate away, then return, and confirm your note is still there.',
      'Task D3: Add a custom key term to the glossary.',
      'Task D4: Launch flashcards from within a specific study section.',
    ]),
    ...taskGroup('E', 'Practice Setup', [
      'Task E1: Start a Full Practice Exam.',
      'Task E2: Start a Practice-by-Domain session for a specific domain.',
      'Task E3: Start a Practice-by-Difficulty session.',
      'Task E4: Start a Quick Random Drill.',
    ]),
    ...taskGroup('F', 'Quiz / Exam Engine', [
      'Task F1: Answer a question, reveal the hint first, then submit your answer.',
      'Task F2: After answering, read the explanation for both your choice and the correct choice.',
      'Task F3: Let the timer run down without answering and observe what happens at zero.',
      'Task F4 (keyboard-only): Complete 5 questions using only the keyboard (Tab/Enter/Arrows), no mouse or touch.',
      'Task F5 (screen reader, if applicable tester): Complete 3 questions with a screen reader active.',
    ]),
    ...taskGroup('G', 'Results', [
      'Task G1: Submit a full exam and identify your pass/fail status.',
      'Task G2: Identify your weakest domain from the results breakdown.',
      'Task G3: Open a missed question and explain why the correct answer is correct.',
    ]),
    ...taskGroup('H', 'Analytics (Per-Cert)', [
      'Task H1: Navigate to the Analytics screen for your enrolled cert.',
      'Task H2: Locate your Exam Readiness Score and explain what you think it means.',
      'Task H3: Click a point on the accuracy-over-time chart and open that session’s detail.',
      'Task H4: Toggle the chart legend to filter by exam mode.',
      'Task H5: Use "Clear history" and describe the confirmation step you saw.',
    ]),
    ...taskGroup('I', 'Master Analytics', [
      'Task I1 (if enrolled in 2+ certs): Find the cross-certification analytics dashboard.',
      'Task I2: Expand a domain to see individual question history.',
    ]),
    ...taskGroup('J', 'Career Paths', [
      'Task J1: Find a career path relevant to your goals.',
      'Task J2: Use "enroll all" for that path and describe what you expected it to do vs. what it did.',
    ]),
    ...taskGroup('K', 'Flashcards', [
      'Task K1: Flip a card, move to the next/previous card, and shuffle the deck.',
      'Task K2 (mobile only): Activate "Horizontal Mode" and rotate your device.',
      'Task K3: Close the flashcard trainer and confirm you’re back where you started.',
    ]),
    ...taskGroup('L', 'Theme', [
      'Task L1: Toggle dark/light mode, then close and reopen the app to confirm it persisted.',
    ]),
  ],
)

const stage4 = section(
  'STAGE 4: Post-Task Micro-Survey',
  'Ask after every single task above — keep it to 30 seconds. Repeat this block once per task.',
  [
    shortText('16. Task ID:', { required: true }),
    multipleChoice('17. Were you able to complete this task?', ['Yes', 'Yes with difficulty', 'No'], { required: true }),
    rating('18. How easy or difficult was this task? (Single Ease Question)', { min: 1, max: 7, minLabel: 'Very Difficult', maxLabel: 'Very Easy' }),
    longText('19. Did anything about this task surprise you (positively or negatively)?'),
    longText('20. If you struggled, what were you expecting to happen instead?'),
  ],
)

const susItems = [
  '21. I think that I would like to use ITZipper frequently.',
  '22. I found ITZipper unnecessarily complex.',
  '23. I thought ITZipper was easy to use.',
  '24. I think that I would need support from a technical person to use ITZipper.',
  '25. I found the various functions in ITZipper were well integrated.',
  '26. I thought there was too much inconsistency in ITZipper.',
  '27. I would imagine that most people would learn to use ITZipper very quickly.',
  '28. I found ITZipper very cumbersome/awkward to use.',
  '29. I felt very confident using ITZipper.',
  '30. I needed to learn a lot of things before I could get going with ITZipper.',
].map((text) => rating(text, { min: 1, max: 5, minLabel: 'Strongly Disagree', maxLabel: 'Strongly Agree', required: true }))

const stage5 = section('STAGE 5: Post-Session Usability Survey', '', [
  header('5A. Standard System Usability Scale (SUS — answer 1-Strongly Disagree to 5-Strongly Agree)'),
  ...susItems,

  header('5B. ITZipper-Specific Feature Usability'),

  header('Onboarding & First Impressions'),
  yesNo('31. Was it clear that your progress is stored only in this browser, not tied to an account?'),
  rating('32. On a scale of 1-5, how clear was it what ITZipper offers before you clicked anything?', { min: 1, max: 5 }),
  yesNo('33. Was the distinction between "Learn," "Study," and "Practice" clear before you tried each one?'),

  header('Navigation'),
  rating('34. How intuitive was the cert-switcher (hamburger dropdown)?', { min: 1, max: 5 }),
  yesNo('35. Did you ever feel lost or unsure which screen you were on?'),
  longText('36. Would you expect a browser back-button or shareable URL to work here? Did its absence bother you?'),

  header('Learn Mode'),
  yesNo('37. Was the long-form lesson content easy to read and scan on your screen size?'),
  longText('38. Did you feel Learn mode added value distinct from Study mode, or did they feel redundant?'),

  header('Study Mode'),
  yesNo('39. Was it clear when your notes were saving?'),
  longText('40. Would you trust this app with study notes you’d be upset to lose? Why or why not?'),

  header('Practice Setup'),
  yesNo('41. Were the four practice modes (Full/Domain/Difficulty/Quick) clearly differentiated?'),

  header('Quiz / Exam Engine'),
  yesNo('42. Did the timer create appropriate urgency without excessive stress?'),
  longText('43. Was the difficulty/domain/Bloom’s-level badge on each question meaningful, or noise?'),
  longText('44. Would you want to pause/resume an exam? Did its absence bother you?'),

  header('Results'),
  yesNo('45. Is pass/fail communicated clearly to someone with color-vision deficiency (not color alone)?'),
  yesNo('46. Did the by-domain breakdown help you decide what to study next?'),

  header('Analytics'),
  longText('47. Was the Exam Readiness Score’s meaning intuitive, or did it feel like a black box?'),
  longText('48. Were the charts (trend line, domain bars) readable? Did tooltips/hover states work smoothly?'),
  multipleChoice('49. Did the analytics screen feel overwhelming, or well-organized?', ['Overwhelming', 'Well-organized', 'Neither / Mixed']),
  longText('50. Was "Clear history" reversible/safe-feeling, or did it worry you (no undo)?'),

  header('Career Paths'),
  yesNo('51. Did the salary/trajectory info feel trustworthy and relevant?'),

  header('Flashcards'),
  yesNo('52. Did the flashcard overlay feel like a proper modal (background inert, Escape closes it)?'),
  rating('53. Rate the mobile flashcard experience specifically (readability, controls, rotation).', { min: 1, max: 5 }),

  header('Theme / Visual Design'),
  yesNo('54. Did the app respect your OS-level theme preference on first visit?'),
  rating('55. Rate readability/contrast in light mode.', { min: 1, max: 5 }),
  rating('55. Rate readability/contrast in dark mode.', { min: 1, max: 5 }),

  header('Data Persistence & Trust'),
  rating('56. How concerned are you about losing progress since there’s no account/cloud sync?', {
    min: 1,
    max: 5,
    minLabel: 'Not concerned',
    maxLabel: 'Very concerned',
  }),
  yesNo('57. Would you want an export/backup option for your stats and notes?'),

  header('Mobile/Responsive (if tested on mobile)'),
  rating('58. Rate overall mobile usability: Learn.', { min: 1, max: 5 }),
  rating('58. Rate overall mobile usability: Study.', { min: 1, max: 5 }),
  rating('58. Rate overall mobile usability: Practice.', { min: 1, max: 5 }),
  rating('58. Rate overall mobile usability: Analytics.', { min: 1, max: 5 }),
  yesNo('59. Did any layout break, overlap, or require horizontal scrolling?'),
  yesNo('60. Did sticky elements (header, ad slots) ever obscure content, especially near your device’s notch/home-indicator area?'),

  header('5C. Overall / NPS Closers'),
  rating('61. How likely are you to recommend ITZipper to someone studying for this certification?', {
    min: 0,
    max: 10,
    minLabel: 'Not at all likely',
    maxLabel: 'Extremely likely',
  }),
  longText('62. What’s the single most confusing thing you encountered today?'),
  longText('63. What’s the single most useful feature?'),
  longText('64. What would you add or remove first?'),
  longText('65. Any moment where you didn’t know what to do next?'),
])

const stage6 = section(
  'STAGE 6: Accessibility-Focused Pass',
  'Run as its own session with testers who use assistive tech, or as a dedicated block.',
  [
    longText('66. Can you complete a full practice exam using only a keyboard? List every point where you got stuck.'),
    rating('67. Using a screen reader, how understandable are the site’s primary flows?', { min: 1, max: 5 }),
    longText('67. Note any unlabeled controls you encountered while using a screen reader.'),
    yesNo('68. Did your screen reader announce the Flashcard Trainer as a dialog when you reached it?'),
    yesNo('68. Did keyboard focus stay trapped inside the Flashcard Trainer while it was open?'),
    longText(
      '69. Is there ever information conveyed by color alone (pass/fail badges, difficulty tiers, chart legends) that you couldn’t otherwise identify?',
    ),
    yesNo('70. Did you notice a skip-navigation link or any way to bypass the header to reach main content?'),
    yesNo('71. Were form controls (domain pickers, difficulty selects, question-count inputs) properly labeled and announced?'),
    yesNo('72. Overall, would you describe ITZipper as usable with your assistive technology today?'),
    longText('72. What’s the single biggest blocker (if any)?'),
  ],
)

const stage7 = section(
  'STAGE 7: UAT Acceptance Sign-off (Stakeholder Checklist)',
  'Purpose: business/stakeholder-facing pass/fail acceptance criteria — not tester opinion, but verified fact, mapped to how the app is supposed to behave. Each item should be checked by a stakeholder or QA pass, with evidence (screenshot/recording) attached.',
  [
    passFail('73. Enrollment state (Enroll → Continue) persists correctly across a page reload.'),
    passFail('74. Practice exam session never repeats a question within the same session.'),
    passFail('75. Full Practice Exam question mix is balanced across domains proportional to the cert blueprint.'),
    passFail('76. Adaptive difficulty escalates appropriately as accuracy improves within a session/over time.'),
    passFail('77. Countdown timer auto-submits the exam at 0:00 without data loss.'),
    passFail('78. Every question displays exactly 4 options, 1 correct index, and an explanation for all 4 options (per question metadata schema).'),
    passFail('79. Results screen accurately reflects the pass threshold (≥80%) and domain-level accuracy.'),
    passFail(
      '80. Exam Readiness Score calculation matches the documented weighting (40% accuracy / 25% hard-question accuracy / 20% domain coverage / 15% recent consistency).',
    ),
    passFail('81. "Clear history" fully removes stored stats for that cert and requires explicit confirmation first.'),
    passFail('82. Theme preference and enrollment/progress data persist correctly in localStorage across sessions in the same browser.'),
    passFail('83. Study notes auto-save without data loss and reload correctly on return.'),
    passFail('84. No copyrighted/verbatim exam content appears in any question bank (spot-check against source vendor material).'),
    passFail('85. No user input (notes, custom key terms) is rendered unescaped anywhere (XSS check).'),
    passFail('86. App functions correctly with no backend reachable (graceful localStorage fallback for study notes API).'),
    passFail('87. All primary flows (Learn, Study, Practice, Results, Analytics) are keyboard-navigable.', {
      hint: 'Currently expected to FAIL — flag as a known gap, not a regression.',
    }),
    passFail('88. Flashcard modal traps focus and is announced correctly to screen readers.', {
      hint: 'Currently expected to FAIL — flag as a known gap.',
    }),
  ],
)

const stage8 = section('STAGE 8: Follow-Up / Retention Survey', 'Send by email 3-7 days after the test session.', [
  yesNo('89. Have you returned to ITZipper since your test session?'),
  yesNo('90. If yes, was your previous progress (stats, notes, enrolled certs) still there?'),
  longText('91. If no, why not — what would bring you back?'),
  longText('92. Did you try ITZipper on a different browser or device since the test? If so, what happened to your progress?'),
  longText('93. Has your opinion of the app changed since the initial test session? How?'),
  rating('94. Would you still recommend ITZipper to someone studying for this cert? (re-ask NPS)', { min: 0, max: 10 }),
  longText('95. Is there a feature you wish existed that we haven’t discussed?'),
])

export const itzipperUatSurvey = {
  id: 'itzipper-uat-survey',
  title: 'ITZipper User Testing Survey Suite',
  description:
    'Full multi-stage UAT & Usability program, based on the live application. Stages run in order across a test session (and beyond it): Pre-Test Screener, Pre-Task Expectations, Task-Based UAT Script, Post-Task Micro-Survey, Post-Session Usability Survey, Accessibility-Focused Pass, UAT Acceptance Sign-off, and Follow-Up / Retention Survey.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8],
}
