/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringUtilities } from './string.fns';

const search = <T = any>(items: T[], searchText: any, fields?: (string | undefined) | (string | undefined)[], children?: string): T[] => {
  if (!searchText?.toString()) return items;
  if (!items?.length) return items;
  if (Array.isArray(fields)) {
    const fs = fields.filter(e => e !== undefined && e !== null && e !== '') as string[];
    if (!fs.length)
      return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
    return items.filter(
      item =>
        (item !== undefined && item !== null && fs.some(field => StringUtilities.aliasIncludes((item as any)[field], searchText))) ||
        (children && search((item as any)[children], searchText, fields, children)?.length),
    );
  }
  if (!fields)
    return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
  return items.filter(
    item =>
      (item !== undefined && item !== null && StringUtilities.aliasIncludes((item as any)[fields], searchText)) ||
      (children && search((item as any)[children], searchText, fields, children)?.length),
  );
};

const union = <T = unknown>(key: string, ...args: (T[] | undefined | null)[]) => {
  let results: T[] = [];
  const filterUnion = <T = any>(val: T, index: number, self: T[]) =>
    val !== undefined && val !== null && self.findIndex(e => (e as any)[key] === (val as any)[key]) === index;
  if (!args?.length) return [];
  for (const arg of args) {
    if (Array.isArray(arg)) results = [...results, ...arg].filter(filterUnion);
  }
  return results;
};

const toObject = <T>(key: string, items: T[] | undefined | null): Record<string, T> => {
  if (!Array.isArray(items)) return {};
  return items
    .filter(item => item !== undefined && item !== null)
    .reduce<Record<string, any>>((obj, item: Record<string, any>) => {
      const objKey = item?.[key]?.toString();
      if (typeof objKey === 'string') obj[objKey] = item;
      return obj;
    }, {});
};

const distinct = <T = any>(items: T[] | undefined | null) => (Array.isArray(items) ? [...new Set(items)] : []);

const paging = <T = any>(items: T[] | undefined | null, pageSize: number, page = 0): T[] => {
  if (!Array.isArray(items)) return [];
  return items.filter((_, index) => index >= page * pageSize && index < (page + 1) * pageSize);
};

export const ArrayUtilities = { search, union, toObject, distinct, paging };
