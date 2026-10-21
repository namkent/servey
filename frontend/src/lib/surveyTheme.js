/**
 * SurveyJS custom theme to match our design system.
 * Applied in main.js and surveyTaker/creator wrappers.
 */
export function applySurveyTheme(isDark = false) {
  // SurveyJS defaultV2 theme is imported in main.js and styled via CSS variables in style.css
}

/**
 * Returns survey creator options object.
 */
export function getCreatorOptions() {
  return {
    showLogicTab: true,
    showTranslationTab: false,
    isAutoSave: false,
    showSaveButton: false,
    showSidebar: true,
  }
}
