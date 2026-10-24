/**
 * Default display placeholder `'--'` for empty/null UI values. This constant performs no
 * conversion or validation; callers decide which values count as empty.
 *
 * @example const value: string | null = null; const label = value ?? EMPTY_STR; // '--'
 */
export const EMPTY_STR = '--';

/**
 * Browser localStorage key `'sd-core.language'` used by BrowserUtilities.upload for
 * validation-message language selection. Recognized values are vi/en/ja/ko/zh;
 * missing, inaccessible, or unsupported storage values fall back to Vietnamese.
 * Reading/importing this constant does not access storage or install an i18n service.
 *
 * @example localStorage.setItem(SD_LANGUAGE_STORAGE_KEY, 'en'); // Browser context.
 */
export const SD_LANGUAGE_STORAGE_KEY = 'sd-core.language';
