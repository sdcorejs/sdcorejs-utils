/**
 * Legacy Material Icons font set identifiers (ligature-based icon font, older generation).
 *
 * @see https://fonts.google.com/icons (filter: Material Icons)
 * @example
 * const fontSet: MaterialIconFontSet = 'material-icons-outlined';
 */
export type MaterialIconFontSet =
  | 'material-icons'
  | 'material-icons-outlined'
  | 'material-icons-round'
  | 'material-icons-sharp';

/**
 * Material Symbols font set identifiers (variable font, newer generation).
 * Prefer this over MaterialIconFontSet for new projects.
 *
 * @see https://fonts.google.com/icons (filter: Material Symbols)
 * @example
 * const fontSet: MaterialSymbolFontSet = 'material-symbols-outlined';
 */
export type MaterialSymbolFontSet =
  | 'material-symbols-outlined'
  | 'material-symbols-rounded'
  | 'material-symbols-sharp';
