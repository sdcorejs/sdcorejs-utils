import { Operator } from '../models/operator.model';

export const OPERATORS: {
  value: Operator;
  symbol?: string;
  display: string;
}[] = [
  { value: 'EQUAL',            symbol: '=',                 display: 'core.operator.equal.display' },
  { value: 'NOT_EQUAL',        symbol: '≠',                 display: 'core.operator.not-equal.display' },
  { value: 'GREATER_THAN',     symbol: '>',                 display: 'core.operator.greater-than.display' },
  { value: 'LESS_THAN',        symbol: '<',                 display: 'core.operator.less-than.display' },
  { value: 'GREATER_OR_EQUAL', symbol: '≥',                 display: 'core.operator.greater-or-equal.display' },
  { value: 'LESS_OR_EQUAL',    symbol: '≤',                 display: 'core.operator.less-or-equal.display' },
  { value: 'CONTAIN',          symbol: 'join_inner',        display: 'core.operator.contain.display' },
  { value: 'NOT_CONTAIN',      symbol: 'join',              display: 'core.operator.not-contain.display' },
  { value: 'START_WITH',       symbol: 'line_start_circle', display: 'core.operator.start-with.display' },
  { value: 'END_WITH',         symbol: 'line_end_circle',   display: 'core.operator.end-with.display' },
  { value: 'IN',               symbol: 'checklist_rtl',     display: 'core.operator.in.display' },
  { value: 'NOT_IN',           symbol: 'event_list',        display: 'core.operator.not-in.display' },
  { value: 'NULL',             symbol: 'motion_photos_off', display: 'core.operator.null.display' },
  { value: 'NOT_NULL',         symbol: 'adjust',            display: 'core.operator.not-null.display' },
];
