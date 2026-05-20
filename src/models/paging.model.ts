import { Filter } from './filter.model';
import { NestedKeyOf } from './nested-key-of.model';
import { Order } from './order.model';

export interface QueryReq<T = any> {
  filters?: Filter<T>[];
  fields?: NestedKeyOf<T>[];
}

export interface PagingReq<T = any> extends QueryReq<T> {
  pageSize?: number;
  pageNumber?: number;
  orders?: Order<T>[];
}

export interface PagingRes<T = any> {
  items: T[];
  total: number;
}
