import { Language } from '../models/language.model';

/**
 * Ordered language codes supported by the package's language model and built-in upload messages:
 * Vietnamese, English, Japanese, Korean, and Chinese. Use for selectors or explicit locale validation.
 * The array is readonly at the type level, not runtime-frozen; do not mutate the shared value.
 * This package does not provide an i18n service or load translations for application-specific keys.
 *
 * @example SUPPORTED_LANGUAGES.includes('en'); // true
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
