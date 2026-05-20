import { Language } from '../models/language.model';

/**
 * Complete list of locale codes supported by `I18nService`.
 *
 * Use this array to populate language-selector dropdowns or to validate a user-supplied
 * locale string before calling `i18nService.setLanguage()`.
 *
 * @example
 * const isSupported = SUPPORTED_LANGUAGES.includes(userLocale as Language);
 * // true for 'vi', 'en', 'ja', 'ko', 'zh' — false for anything else
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
