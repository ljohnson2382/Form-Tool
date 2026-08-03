import './styles.css'

export { default as FormBuilderApp, MODES } from './FormBuilderApp.jsx'
export { default as ErrorBoundary } from './components/common/ErrorBoundary.jsx'

export { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
export { BrandProvider, useBrand, defaultBrand } from './context/BrandContext.jsx'

export { default as DashboardScreen } from './screens/DashboardScreen.jsx'
export { default as BuilderScreen } from './screens/BuilderScreen.jsx'
export { default as PreviewScreen } from './screens/PreviewScreen.jsx'
export { default as FillScreen } from './screens/FillScreen.jsx'
export { default as ResponsesScreen } from './screens/ResponsesScreen.jsx'
export { default as AdminSettingsScreen } from './screens/AdminSettingsScreen.jsx'

export {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  MAX_SCALE_POINTS,
  createId,
  createItem,
  createSection,
  createEmptyForm,
  isAnswerable,
  countQuestions,
  validateResponses,
  normalizeScale,
  normalizeOptions,
  normalizeBrand,
  sectionsOf,
  itemsOf,
} from './data/formSchema.js'

export { normalizeForm, FormValidationError } from './data/formValidation.js'

export { configureStorage } from './utils/db.js'
export { configureBackend } from './utils/backendConfig.js'
export { parseDetectedBrands } from './utils/brandAssets.js'
export { getAppBrand, saveAppBrand } from './utils/appSettings.js'

export {
  listForms,
  getForm,
  saveForm,
  deleteForm,
  duplicateForm,
  importForm,
  seedIfEmpty,
  publishForm,
  unpublishForm,
} from './utils/formStore.js'

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
  saveJsxToFile,
  openJsonFile,
  readJsonFromInputFile,
  openMarkdownFile,
  readTextFromInputFile,
} from './utils/fileStorage.js'

export { generateFormComponent, suggestedComponentFilename } from './utils/generateFormComponent.js'

export { parseMarkdownToForm } from './utils/markdownImport.js'

export { THEME_STORAGE_KEY } from './utils/theme.js'
