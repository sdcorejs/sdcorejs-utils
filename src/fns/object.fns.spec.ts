import { describe, expect, it } from 'vitest';
import { ObjectUtilities, Utilities } from './utility.fns';

type LooseRecord = Record<string, any>;

class DemoClass {
  constructor(public value: string) {}
}

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

describe('ObjectUtilities export surface', () => {
  it('exposes object helpers from ObjectUtilities and Utilities', () => {
    expect(ObjectUtilities.isPlainObject).toBe(Utilities.isPlainObject);
    expect(ObjectUtilities.clone).toBe(Utilities.clone);
    expect(ObjectUtilities.merge).toBe(Utilities.merge);
    expect(ObjectUtilities.deepMerge).toBe(Utilities.deepMerge);
    expect(ObjectUtilities.hash).toBe(Utilities.hash);
    expect(ObjectUtilities.parseQueryParams).toBe(Utilities.parseQueryParams);
    expect(ObjectUtilities.getNestedValue).toBe(Utilities.getNestedValue);
    expect(ObjectUtilities.stableStringify).toBe(Utilities.stableStringify);
  });
});

describe('ObjectUtilities.isPlainObject', () => {
  it('accepts object literals and null-prototype records', () => {
    const nullPrototypeRecord = Object.create(null);
    nullPrototypeRecord.enabled = true;

    expect(ObjectUtilities.isPlainObject({})).toBe(true);
    expect(ObjectUtilities.isPlainObject({ nested: { value: 1 } })).toBe(true);
    expect(ObjectUtilities.isPlainObject(nullPrototypeRecord)).toBe(true);
  });

  it('rejects custom prototypes, class instances, arrays, built-ins, functions, and primitives', () => {
    const customPrototypeRecord = Object.create({ inherited: true });
    customPrototypeRecord.own = true;

    const invalidValues = [
      null,
      undefined,
      true,
      1,
      'text',
      Symbol('symbol'),
      1n,
      [],
      customPrototypeRecord,
      new DemoClass('demo'),
      new Date('2026-01-01T00:00:00.000Z'),
      /value/u,
      new Map([['key', 'value']]),
      new Set(['value']),
      Promise.resolve('value'),
      () => 'value',
    ];

    for (const value of invalidValues) {
      expect(ObjectUtilities.isPlainObject(value)).toBe(false);
    }
  });
});

describe('ObjectUtilities.clone', () => {
  it('deeply clones nested arrays and plain objects without mutating the source graph', () => {
    const source = {
      id: 'settings',
      nested: {
        enabled: true,
        values: [{ code: 'A' }, { code: 'B' }],
        optional: undefined,
      },
      tags: ['alpha', { label: 'beta' }],
    };

    const result = ObjectUtilities.clone(source);

    expect(result).toEqual(source);
    expect(result).not.toBe(source);
    expect(result.nested).not.toBe(source.nested);
    expect(result.nested.values).not.toBe(source.nested.values);
    expect(result.nested.values[0]).not.toBe(source.nested.values[0]);
    expect(result.tags).not.toBe(source.tags);
    expect(result.tags[1]).not.toBe(source.tags[1]);
    expect(hasOwn(result.nested, 'optional')).toBe(true);

    result.nested.values[0].code = 'CHANGED';
    (result.tags[1] as { label: string }).label = 'changed';

    expect(source.nested.values[0].code).toBe('A');
    expect((source.tags[1] as { label: string }).label).toBe('beta');
  });

  it('clones null-prototype records and normalizes the output as a plain object', () => {
    const source = Object.create(null);
    source.name = 'null-prototype';
    source.nested = { value: 1 };

    const result = ObjectUtilities.clone(source);

    expect(result).toEqual({
      name: 'null-prototype',
      nested: { value: 1 },
    });
    expect(result).not.toBe(source);
    expect(result.nested).not.toBe(source.nested);
    expect(ObjectUtilities.isPlainObject(result)).toBe(true);

    result.nested.value = 2;
    expect(source.nested.value).toBe(1);
  });

  it('leaves non-plain object leaves by reference', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const map = new Map([['nested', { value: 1 }]]);
    const instance = new DemoClass('instance');
    const callback = () => 'callback';
    const source = { date, map, instance, callback };

    const result = ObjectUtilities.clone(source);

    expect(result).not.toBe(source);
    expect(result.date).toBe(date);
    expect(result.map).toBe(map);
    expect(result.instance).toBe(instance);
    expect(result.callback).toBe(callback);
  });
});

describe('ObjectUtilities.merge', () => {
  it('returns a cloned default value when the override is undefined', () => {
    const defaultValue = {
      page: {
        size: 20,
        sort: [{ field: 'name', direction: 'asc' }],
      },
    };

    const result = ObjectUtilities.merge(defaultValue, undefined);

    expect(result).toEqual(defaultValue);
    expect(result).not.toBe(defaultValue);
    expect(result.page).not.toBe(defaultValue.page);
    expect(result.page.sort).not.toBe(defaultValue.page.sort);
    expect(result.page.sort[0]).not.toBe(defaultValue.page.sort[0]);

    result.page.sort[0].direction = 'desc';
    expect(defaultValue.page.sort[0].direction).toBe('asc');
  });

  it('recursively combines plain object keys and lets defined overrides win', () => {
    const defaultValue = {
      theme: {
        mode: 'light',
        density: 'comfortable',
        tokens: {
          primary: 'blue',
          radius: 4,
        },
      },
      table: {
        columns: ['name', 'email'],
        pageSize: 20,
      },
      featureEnabled: true,
    };
    const overrideValue = {
      theme: {
        density: 'compact',
        tokens: {
          radius: 8,
        },
      },
      table: {
        columns: ['id'],
      },
      extra: {
        enabled: true,
      },
    };

    const result = ObjectUtilities.merge<LooseRecord>(defaultValue, overrideValue);

    expect(result).toEqual({
      theme: {
        mode: 'light',
        density: 'compact',
        tokens: {
          primary: 'blue',
          radius: 8,
        },
      },
      table: {
        columns: ['id'],
        pageSize: 20,
      },
      featureEnabled: true,
      extra: {
        enabled: true,
      },
    });

    expect(result.theme).not.toBe(defaultValue.theme);
    expect(result.theme.tokens).not.toBe(defaultValue.theme.tokens);
    expect(result.table.columns).not.toBe(overrideValue.table.columns);
    expect(result.extra).not.toBe(overrideValue.extra);

    result.theme.tokens.primary = 'red';
    result.table.columns.push('createdAt');
    result.extra.enabled = false;

    expect(defaultValue.theme.tokens.primary).toBe('blue');
    expect(defaultValue.table.columns).toEqual(['name', 'email']);
    expect(overrideValue.table.columns).toEqual(['id']);
    expect(overrideValue.extra.enabled).toBe(true);
  });

  it('treats undefined as inherit-default but null as an explicit override', () => {
    const defaultValue = {
      title: 'Default',
      count: 3,
      nested: {
        keep: 'yes',
        replace: 'old',
      },
    };
    const overrideValue = {
      title: undefined,
      count: null,
      nested: {
        keep: undefined,
        replace: null,
      },
    };

    const result = ObjectUtilities.merge<LooseRecord>(defaultValue, overrideValue);

    expect(result).toEqual({
      title: 'Default',
      count: null,
      nested: {
        keep: 'yes',
        replace: null,
      },
    });
  });

  it('replaces arrays instead of merging by index and clones the replacement array', () => {
    const defaultValue = {
      items: [{ id: 1 }, { id: 2 }],
    };
    const overrideValue = {
      items: [{ id: 3 }],
    };

    const result = ObjectUtilities.merge(defaultValue, overrideValue);

    expect(result).toEqual({
      items: [{ id: 3 }],
    });
    expect(result.items).not.toBe(overrideValue.items);
    expect(result.items[0]).not.toBe(overrideValue.items[0]);

    result.items[0].id = 99;
    expect(overrideValue.items[0].id).toBe(3);
    expect(defaultValue.items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('replaces non-plain object leaves with the override leaf reference', () => {
    const defaultDate = new Date('2026-01-01T00:00:00.000Z');
    const overrideDate = new Date('2026-02-01T00:00:00.000Z');
    const overrideInstance = new DemoClass('override');

    expect(ObjectUtilities.merge(defaultDate, overrideDate)).toBe(overrideDate);
    expect(ObjectUtilities.merge({ value: 'default' }, overrideInstance)).toBe(overrideInstance);
  });
});

describe('ObjectUtilities.deepMerge', () => {
  it('folds multiple sources from left to right', () => {
    const first = {
      env: {
        api: '/api',
        headers: {
          accept: 'application/json',
        },
      },
      flags: ['alpha'],
      feature: {
        enabled: false,
      },
    };
    const second = {
      env: {
        headers: {
          authorization: 'Bearer token',
        },
      },
      flags: ['beta'],
      feature: {
        enabled: undefined,
        rollout: 25,
      },
    };
    const third = {
      env: {
        api: '/v2',
      },
      feature: null,
    };

    const result = ObjectUtilities.deepMerge<LooseRecord>(first, second, third);

    expect(result).toEqual({
      env: {
        api: '/v2',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer token',
        },
      },
      flags: ['beta'],
      feature: null,
    });
  });

  it('returns an empty object for no sources and clones merged state away from inputs', () => {
    const first = {
      nested: {
        keep: 'default',
      },
    };
    const second = {
      nested: {
        add: 'override',
      },
      list: [{ id: 1 }],
    };

    const emptyResult = ObjectUtilities.deepMerge();
    const result = ObjectUtilities.deepMerge<LooseRecord>(first, second);

    expect(emptyResult).toEqual({});
    expect(result).toEqual({
      nested: {
        keep: 'default',
        add: 'override',
      },
      list: [{ id: 1 }],
    });

    expect(result.nested).not.toBe(first.nested);
    expect(result.nested).not.toBe(second.nested);
    expect(result.list).not.toBe(second.list);
    expect(result.list[0]).not.toBe(second.list[0]);

    result.nested.keep = 'changed';
    result.list[0].id = 2;

    expect(first.nested.keep).toBe('default');
    expect(second.list[0].id).toBe(1);
  });
});
