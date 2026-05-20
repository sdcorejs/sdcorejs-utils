/**
 * Semantic color token used across UI components to convey intent or state.
 *
 * - `'primary'` — brand / default action color
 * - `'secondary'` — secondary / alternative action color
 * - `'info'` — informational, neutral tone
 * - `'success'` — positive outcome, confirmation
 * - `'warning'` — caution, needs attention
 * - `'error'` — destructive action or validation failure
 *
 * @example
 * const alertColor: Color = 'success';
 * // <sd-alert [color]="alertColor">Record saved.</sd-alert>
 */
export type Color = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
