/**
 * Supported language codes: vi (Vietnamese), en (English), ja (Japanese), ko (Korean),
 * and zh (Chinese). This is a compile-time union, not a runtime validator or translation service.
 * Use SUPPORTED_LANGUAGES to validate an external code; region-specific tags such as en-US are not members.
 *
 * @example const language: Language = 'vi';
 */
export type Language = 'vi' | 'en' | 'ja' | 'ko' | 'zh';
