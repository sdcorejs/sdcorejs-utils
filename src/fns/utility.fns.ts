/* eslint-disable @typescript-eslint/no-explicit-any */

const allWithPaging = async <T = unknown>(
  func: (pageSize: number, pageNumber: number) => Promise<{ items: T[]; total: number }>,
  defaultPageSize?: number
): Promise<T[]> => {
  const pageSize = defaultPageSize || 1000;
  let pageNumber = 0;
  let count = 0;
  let items: T[] = [];
  while (true) {
    const res = await func(pageSize, pageNumber);
    if (Array(res?.items) && res?.total > 0) {
      items = [...items, ...res.items];
      count += res.items.length;
      pageNumber++;
      if (count >= res.total || !res.items?.length) {
        return items;
      }
    } else {
      return [];
    }
  }
};

const randomId = (prefix?: string | null): string => {
  const id = `${new Date().getTime().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  if (prefix) {
    return `${prefix}_${id}`;
  }
  return id;
};

const hash = (obj: any): string => {
  const json = stableStringify(obj);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    hash = (hash << 5) - hash + json.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return `h${Math.abs(hash)}`;
};

const stableStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (obj instanceof File) {
    // Chỉ serialize các thuộc tính quan trọng của File
    return JSON.stringify({
      __type: 'File',
      name: obj.name,
      size: obj.size,
      type: obj.type,
      lastModified: obj.lastModified,
    });
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(obj).sort();
  const keyValuePairs = keys.map(key => `"${key}":${stableStringify(obj[key])}`);
  return `{${keyValuePairs.join(',')}}`;
};

const parseQueryParams = (queryString?: string): Record<string, string> => {
  const params = new URLSearchParams(queryString || '');
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback cho browser cũ
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const getNestedValue = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const Utilities = {
  allWithPaging,
  randomId,
  hash,
  parseQueryParams,
  generateUuid,
  getNestedValue,
};
