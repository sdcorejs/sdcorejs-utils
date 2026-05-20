import { SdNestedKeyOf } from './nested-key-of.model';
import { SdOperatorHasData, SdOperatorNoData } from './operator.model';

export type SdFilter<T = any> = SdFilterHasData<T> | SdFilterBetween<T> | SdFilterNoData<T> | SdFilterAndOr<T>;

export interface SdFilterHasData<T = any> {
  field: SdNestedKeyOf<T>;
  operator: Exclude<SdOperatorHasData, 'BETWEEN'>;
  data: any;
}

export interface SdFilterBetween<T = any> {
  field: SdNestedKeyOf<T>;
  operator: 'BETWEEN';
  data: {
    from: string | number;
    to: string | number;
  };
}

export interface SdFilterNoData<T = any> {
  field: SdNestedKeyOf<T>;
  operator: SdOperatorNoData;
}

export interface SdFilterAndOr<T = any> {
  operator: 'AND' | 'OR';
  data: SdFilter<T>[];
}
