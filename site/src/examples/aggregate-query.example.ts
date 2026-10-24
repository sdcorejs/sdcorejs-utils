import type { AggregateReq, AggregateRes } from '@sdcorejs/utils/models';

interface Product {
  category: string;
  priceCents: number;
  active: boolean;
}

// Send this request to an application endpoint backed by an aggregate executor.
// The utils package defines the contract; it does not execute SQL.
const request: AggregateReq<Product> = {
  filters: [{ field: 'active', operator: 'EQUAL', data: true }],
  groupBy: ['category'],
  fields: ['category'],
  aggregates: [
    { field: 'priceCents', operation: 'sum', alias: 'totalPrice' },
    { field: 'priceCents', operation: 'max', alias: 'maxPrice' },
    { field: '*', operation: 'count', alias: 'productCount' },
  ],
};

// Example result for a PostgreSQL integer price column: sum/count stay strings.
const response: AggregateRes = [
  { category: 'books', totalPrice: '30000', maxPrice: 20000, productCount: '2' },
  { category: 'stationery', totalPrice: '5000', maxPrice: 5000, productCount: '1' },
];

// An endpoint with a fixed result schema can declare a narrower row type.
interface CategoryTotals {
  category: string;
  totalPrice: string;
  maxPrice: number | null;
  productCount: string;
}
const typedResponse: AggregateRes<CategoryTotals> = [
  { category: 'books', totalPrice: '30000', maxPrice: 20000, productCount: '2' },
];

void [request, response, typedResponse];
