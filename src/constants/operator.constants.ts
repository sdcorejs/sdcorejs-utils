import { Operator } from "../models/operator.model";

/**
 * Master list of all filter operators with display metadata for use in filter-builder UIs.
 *
 * Each entry provides:
 * - `value` — the `Operator` string sent to the API
 * - `icon` — inner SVG markup (paths/lines/rects) rendered inside a 24×24 `<svg>` in the UI
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
    icon: `<line x1="5.5" y1="9.5" x2="18.5" y2="9.5"/><line x1="5.5" y1="14.5" x2="18.5" y2="14.5"/>`,
    display: "core.operator.equal.display",
  },
  {
    value: "NOT_EQUAL",
    icon: `<line x1="5.5" y1="9.5" x2="18.5" y2="9.5"/><line x1="5.5" y1="14.5" x2="18.5" y2="14.5"/><line x1="18" y1="5" x2="6" y2="19"/>`,
    display: "core.operator.not-equal.display",
  },
  {
    value: "GREATER_THAN",
    icon: `<polyline points="9,5 16,12 9,19"/>`,
    display: "core.operator.greater-than.display",
  },
  {
    value: "LESS_THAN",
    icon: `<polyline points="15,5 8,12 15,19"/>`,
    display: "core.operator.less-than.display",
  },
  {
    value: "GREATER_OR_EQUAL",
    icon: `<polyline points="8,4 15,11 8,18"/><line x1="7" y1="21" x2="17" y2="21"/>`,
    display: "core.operator.greater-or-equal.display",
  },
  {
    value: "LESS_OR_EQUAL",
    icon: `<polyline points="16,4 9,11 16,18"/><line x1="7" y1="21" x2="17" y2="21"/>`,
    display: "core.operator.less-or-equal.display",
  },
  // String-match family: a pill represents the string; a filled segment shows
  // WHERE in the string the match must appear (start / middle / end).
  {
    value: "CONTAIN",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="9.5" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/>`,
    display: "core.operator.contain.display",
  },
  {
    value: "NOT_CONTAIN",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="9.5" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="5" y2="19"/>`,
    display: "core.operator.not-contain.display",
  },
  {
    value: "START_WITH",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="5" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/>`,
    display: "core.operator.start-with.display",
  },
  {
    value: "NOT_START_WITH",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="5" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="5" y2="19"/>`,
    display: "core.operator.not-start-with.display",
  },
  {
    value: "END_WITH",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="14" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/>`,
    display: "core.operator.end-with.display",
  },
  {
    value: "NOT_END_WITH",
    icon: `<rect x="3" y="8" width="18" height="8" rx="4"/><rect x="14" y="10.75" width="5" height="2.5" rx="1.25" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="5" y2="19"/>`,
    display: "core.operator.not-end-with.display",
  },
  {
    value: "IN",
    icon: `<circle cx="13" cy="12" r="6"/><circle cx="13" cy="12" r="2.1" fill="currentColor" stroke="none"/>`,
    display: "core.operator.in.display",
  },
  {
    value: "NOT_IN",
    icon: `<circle cx="13" cy="12" r="6"/><circle cx="13" cy="12" r="2.1" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="5" y2="19"/>`,
    display: "core.operator.not-in.display",
  },
  {
    // Two endpoint dots connected by a line — "value falls within {from, to}".
    // Distinct from string-match pill family because there is no enclosing rect.
    value: "BETWEEN",
    icon: `<line x1="6" y1="12" x2="18" y2="12"/><circle cx="6" cy="12" r="2.75" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="2.75" fill="currentColor" stroke="none"/>`,
    display: "core.operator.between.display",
  },
  {
    value: "NULL",
    icon: `<circle cx="12" cy="12" r="7" stroke-dasharray="2.4 2.6"/><line x1="17.5" y1="6.5" x2="6.5" y2="17.5"/>`,
    display: "core.operator.null.display",
  },
  {
    // Single solid disc — direct visual opposite of NULL's dashed empty ring.
    value: "NOT_NULL",
    icon: `<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>`,
    display: "core.operator.not-null.display",
  },
];
