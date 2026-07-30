import './styles.css'

export { default as FormBuilderApp } from './FormBuilderApp.jsx'

export { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
export { BrandProvider, useBrand, defaultBrand } from './context/BrandContext.jsx'

export { default as DashboardScreen } from './screens/DashboardScreen.jsx'
export { default as BuilderScreen } from './screens/BuilderScreen.jsx'
export { default as PreviewScreen } from './screens/PreviewScreen.jsx'
export { default as FillScreen } from './screens/FillScreen.jsx'

export {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  createId,
  createItem,
  createSection,
  createEmptyForm,
  isAnswerable,
  countQuestions,
  validateResponses,
} from './data/formSchema.js'

export { listForms, getForm, saveForm, deleteForm, duplicateForm, importForm, seedIfEmpty } from './utils/formStore.js'

export {
  submitResponse,
  listResponses,
  deleteResponse,
  deleteResponsesForForm,
  exportResponsesToFile,
} from './utils/responseStore.js'

export {
  supportsFileSystemAccess,
  saveJsonToFile,
  suggestedFormFilename,
  openJsonFile,
  readJsonFromInputFile,
  openMarkdownFile,
  readTextFromInputFile,
} from './utils/fileStorage.js'

export { parseMarkdownToForm } from './utils/markdownImport.js'

export { THEME_STORAGE_KEY } from './utils/theme.js'
