export type Operator = OperatorHasData | OperatorNoData;

export type OperatorHasData =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'CONTAIN'
  | 'NOT_CONTAIN'
  | 'IN'
  | 'NOT_IN'
  | 'START_WITH'
  | 'END_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'BETWEEN';

export type OperatorNoData = 'NULL' | 'NOT_NULL';
