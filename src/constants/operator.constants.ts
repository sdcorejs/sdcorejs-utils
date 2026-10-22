import { Operator } from "../models/operator.model";

/**
 * Master list of all filter operators with display metadata for use in filter-builder UIs.
 *
 * Each entry provides:
 * - `value` — the `Operator` string sent to the API
 * - `icon` — inner SVG markup (lines/polylines/rects/circles/paths) rendered inside a 24×24 `<svg>` in the UI
 * - `display` — i18n key resolved by `I18nService` for the operator label
 *
 * Operators that check null-presence (`NULL`, `NOT_NULL`) have an `icon` but no `data` field
 * in the corresponding `FilterNoData` shape.
 *
 * @example
 * // Populate a <select> with all operator options:
 * const options = OPERATORS.map(op => ({ label: translate(op.display), value: op.value }));
 */
export const OPERATORS: {
  value: Operator;
  icon: string;
  display: string;
}[] = [
  {
    value: "EQUAL",
    icon: `<line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/>`,
    display: "core.operator.equal.display",
  },
  {
    value: "NOT_EQUAL",
    icon: `<line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.not-equal.display",
  },
  {
    value: "GREATER_THAN",
    icon: `<polyline points="7,7 17,12 7,17"/>`,
    display: "core.operator.greater-than.display",
  },
  {
    value: "LESS_THAN",
    icon: `<polyline points="17,7 7,12 17,17"/>`,
    display: "core.operator.less-than.display",
  },
  {
    value: "GREATER_OR_EQUAL",
    icon: `<polyline points="7,5 17,10 7,15"/><line x1="7" y1="19" x2="17" y2="19"/>`,
    display: "core.operator.greater-or-equal.display",
  },
  {
    value: "LESS_OR_EQUAL",
    icon: `<polyline points="17,5 7,10 17,15"/><line x1="7" y1="19" x2="17" y2="19"/>`,
    display: "core.operator.less-or-equal.display",
  },
  // String-match family: a 19x10 pill with a 6x4 segment at the start, center, or end.
  // The centered CONTAIN segment means a substring anywhere, not only in the middle.
  {
    value: "CONTAIN",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="9" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>`,
    display: "core.operator.contain.display",
  },
  {
    value: "NOT_CONTAIN",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="9" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.not-contain.display",
  },
  {
    value: "START_WITH",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="5.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>`,
    display: "core.operator.start-with.display",
  },
  {
    value: "NOT_START_WITH",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="5.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.not-start-with.display",
  },
  {
    value: "END_WITH",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="12.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>`,
    display: "core.operator.end-with.display",
  },
  {
    value: "NOT_END_WITH",
    icon: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="12.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.not-end-with.display",
  },
  {
    value: "IN",
    icon: `<path d="M17 6.5h-4.5a5.5 5.5 0 0 0 0 11H17M7 12h9"/>`,
    display: "core.operator.in.display",
  },
  {
    value: "NOT_IN",
    icon: `<path d="M17 6.5h-4.5a5.5 5.5 0 0 0 0 11H17M7 12h9"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.not-in.display",
  },
  {
    // A line joins endpoint dots at x=7 and x=17, each r=2.5: an inclusive range.
    // The dots extend to x=4.5 and x=19.5; there is no enclosing string-match pill.
    value: "BETWEEN",
    icon: `<line x1="7" y1="12" x2="17" y2="12"/><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>`,
    display: "core.operator.between.display",
  },
  {
    // Empty-set glyph: a continuous ring plus the shared negation slash.
    value: "NULL",
    icon: `<circle cx="12" cy="12" r="6.5"/><line x1="17" y1="5" x2="7" y2="19"/>`,
    display: "core.operator.null.display",
  },
  {
    // A ring with a small center dot means present; unlike other NOT_* glyphs,
    // NOT_NULL has no slash. IN uses the membership sign instead.
    value: "NOT_NULL",
    icon: `<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/>`,
    display: "core.operator.not-null.display",
  },
];
