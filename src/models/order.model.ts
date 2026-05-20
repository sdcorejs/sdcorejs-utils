import { NestedKeyOf } from './nested-key-of.model';

export interface Order<T = any> {
  field: NestedKeyOf<T>;
  direction: 'ASC' | 'DESC';
}
