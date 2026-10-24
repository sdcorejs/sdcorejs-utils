import { describe, expect, it } from 'vitest';
import {
  CORE_API_ENTRIES,
  CORE_DOCUMENTED_SYMBOLS,
  CORE_IMPORT_PATHS,
} from './core-entries';

describe('core API reference inventory', () => {
  it('documents each of the 73 model, constant, and error exports exactly once', () => {
    const documented = [...CORE_DOCUMENTED_SYMBOLS];
    const entrySymbols = CORE_API_ENTRIES.map((entry) => entry.symbol);

    expect(documented).toHaveLength(73);
    expect(new Set(documented)).toHaveLength(73);
    expect(entrySymbols).toEqual(documented);
    expect(new Set(entrySymbols)).toHaveLength(73);
  });

  it('uses the canonical public subpath for every entry', () => {
    for (const entry of CORE_API_ENTRIES) {
      expect(entry.importPath).toBe(
        CORE_IMPORT_PATHS[entry.symbol as keyof typeof CORE_IMPORT_PATHS],
      );
    }

    expect(CORE_API_ENTRIES.filter((entry) => entry.importPath === '@sdcorejs/utils/models'))
      .toHaveLength(47);
    expect(CORE_API_ENTRIES.filter((entry) => entry.importPath === '@sdcorejs/utils/constants'))
      .toHaveLength(5);
    expect(CORE_API_ENTRIES.filter((entry) => entry.importPath === '@sdcorejs/utils/errors'))
      .toHaveLength(21);
  });

  it('provides complete bilingual, runtime, security, and example metadata', () => {
    for (const entry of CORE_API_ENTRIES) {
      expect(entry.signature.trim(), entry.symbol).not.toBe('');
      expect(entry.summary.en.trim(), entry.symbol).not.toBe('');
      expect(entry.summary.vi.trim(), entry.symbol).not.toBe('');
      expect(entry.returns.en.trim(), entry.symbol).not.toBe('');
      expect(entry.returns.vi.trim(), entry.symbol).not.toBe('');
      expect(entry.runtimeNotes.en.length, entry.symbol).toBeGreaterThan(0);
      expect(entry.runtimeNotes.vi.length, entry.symbol).toBeGreaterThan(0);
      expect(entry.securityNotes.en.length, entry.symbol).toBeGreaterThan(0);
      expect(entry.securityNotes.vi.length, entry.symbol).toBeGreaterThan(0);
      expect(entry.exampleIds.length, entry.symbol).toBeGreaterThan(0);
      expect(entry.summary.en, entry.symbol).not.toMatch(/^Public .+ member\.$/);
      expect(entry.returns.en, entry.symbol).not.toBe('The value or type described by the signature.');
    }
  });

  it('makes every public error entry discoverable with safe-handling guidance', () => {
    const errorEntries = CORE_API_ENTRIES.filter(
      (entry) => entry.importPath === '@sdcorejs/utils/errors',
    );

    expect(errorEntries).toHaveLength(21);
    for (const entry of errorEntries) {
      expect(entry.pageId, entry.symbol).toBe('api-errors');
      expect(entry.exampleIds, entry.symbol).toContain(entry.symbol === 'isAbortError' ? 'abort-errors' : 'typed-errors');
      expect(entry.securityNotes.en.join(' ').trim(), entry.symbol).not.toBe('');
      expect(entry.securityNotes.vi.join(' ').trim(), entry.symbol).not.toBe('');
    }
  });

  it('documents cancellation precedence and custom signal handling in both languages', () => {
    const entry = CORE_API_ENTRIES.find(item => item.symbol === 'isAbortError');
    expect(entry).toMatchObject({ kind: 'function', pageId: 'api-errors', importPath: '@sdcorejs/utils/errors', exampleIds: ['abort-errors'] });
    expect(entry?.signature).toContain('signal?: AbortSignal | null');
    for (const locale of ['en', 'vi'] as const) {
      expect(entry?.runtimeNotes[locale].join(' ')).toContain('TimeoutError');
      expect(entry?.runtimeNotes[locale].join(' ')).toContain('signal.reason');
      expect(entry?.securityNotes[locale].join(' ')).toContain('Proxy');
    }
  });

  it('keeps the async/RxJS boundary and zero-based paging contract explicit', () => {
    const bySymbol = new Map(CORE_API_ENTRIES.map((entry) => [entry.symbol, entry]));

    expect(bySymbol.get('PagingReq')?.summary.en).toContain('zero-based');
    expect(bySymbol.get('PagingReq')?.properties?.find((item) => item.name === 'pageNumber')?.description.en)
      .toContain('0 is the first page');
    expect(bySymbol.get('MaybeAsync')?.runtimeNotes.en.join(' ')).toContain('no RxJS');
    expect(bySymbol.get('normalizeAsync')?.deprecation?.replacement).toBe('normalizeSubscribable');
  });
});
