import type {
  AggregateOperation,
  AggregateMetric,
  AggregateReq,
  AggregateRes,
  AggregateRow,
  AggregateValue,
  QueryReq,
} from '@sdcorejs/utils/models';

interface Product {
  category: string;
  amount: number;
  active: boolean;
  address: { city: string };
}

const metrics = [
  { field: 'amount', operation: 'sum', alias: 'sumAmount' },
  { field: 'amount', operation: 'max', alias: 'maxAmount' },
  { field: '*', operation: 'count', alias: 'rowCount' },
] as const;
const request: AggregateReq<Product> = {
  filters: [{ field: 'active', operator: 'EQUAL', data: true }],
  fields: ['category'],
  groupBy: ['category'],
  aggregates: metrics,
};
const query: QueryReq<Product> = request;
const nested: AggregateReq<Product> = { aggregates: [], groupBy: ['address.city'] };
const global: AggregateReq<Product> = { aggregates: metrics };
const operations: AggregateOperation[] = ['sum', 'count', 'avg', 'min', 'max'];
const distinct: AggregateMetric<Product> = { field: 'category', operation: 'count', alias: 'categories', distinct: true };
const scalarValues: AggregateValue[] = ['9007199254740993', 1, false, new Date(), null];
const row: AggregateRow = { category: 'books', rowCount: '2', sumAmount: '30', minDate: null };
const response: AggregateRes = [row];
const empty: AggregateRes = [];
interface KnownRow { category: string; rowCount: string }
const known: AggregateRes<KnownRow> = [{ category: 'books', rowCount: '2' }];
const defaults: AggregateReq = { aggregates: [{ field: 'amount', operation: 'avg', alias: 'average' }] };
void [query, nested, global, operations, distinct, scalarValues, response, empty, known, defaults];

// @ts-expect-error A request must supply its aggregate calculations.
const missingMetrics: AggregateReq<Product> = { groupBy: ['category'] };
// @ts-expect-error Field paths are checked against the entity shape.
const unknownField: AggregateMetric<Product> = { field: 'missing', operation: 'sum', alias: 'total' };
// @ts-expect-error Only the five supported operations are accepted.
const unsupportedOperation: AggregateMetric<Product> = { field: 'amount', operation: 'median', alias: 'median' };
// @ts-expect-error An output alias is required for every metric.
const missingAlias: AggregateMetric<Product> = { field: 'amount', operation: 'sum' };
// @ts-expect-error Group paths are checked against the entity shape.
const unknownGroup: AggregateReq<Product> = { aggregates: metrics, groupBy: ['missing'] };
// @ts-expect-error Projection paths are checked against the entity shape.
const unknownProjection: AggregateReq<Product> = { aggregates: metrics, fields: ['missing'] };
// @ts-expect-error Aggregate responses are arrays, not paging envelopes.
const pagingEnvelope: AggregateRes = { items: [], total: 0 };
// @ts-expect-error Default rows contain scalar values, not nested objects.
const nestedResponse: AggregateRes = [{ nested: { amount: 1 } }];
// @ts-expect-error The supplied row shape is preserved.
const wrongKnownRow: AggregateRes<KnownRow> = [{ category: 'books', rowCount: 2 }];
void [missingMetrics, unknownField, unsupportedOperation, missingAlias, unknownGroup, unknownProjection, pagingEnvelope, nestedResponse, wrongKnownRow];
