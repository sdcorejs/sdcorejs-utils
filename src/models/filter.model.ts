import { NestedKeyOf } from './nested-key-of.model';
import { OperatorHasData, OperatorNoData } from './operator.model';

export type Filter<T = any> = FilterHasData<T> | FilterBetween<T> | FilterNoData<T> | FilterAndOr<T>;

export interface FilterHasData<T = any> {
  field: NestedKeyOf<T>;
  operator: Exclude<OperatorHasData, 'BETWEEN'>;
  data: any;
}

export interface FilterBetween<T = any> {
  field: NestedKeyOf<T>;
  operator: 'BETWEEN';
  data: {
    from: string | number;
    to: string | number;
  };
}

export interface FilterNoData<T = any> {
  field: NestedKeyOf<T>;
  operator: OperatorNoData;
}

export interface FilterAndOr<T = any> {
  operator: 'AND' | 'OR';
  data: Filter<T>[];
}
