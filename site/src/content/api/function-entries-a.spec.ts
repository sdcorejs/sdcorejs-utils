import { describe, expect, it } from 'vitest';
import {
  FUNCTION_A_API_ENTRIES,
  FUNCTION_A_DOCUMENTED_SYMBOLS,
  FUNCTION_A_IMPORT_PATHS,
  FUNCTION_A_NAMESPACE_MEMBERS,
} from './function-entries-a';

const canonicalExamples = new Set([
  'aes-gcm',
  'array-operations',
  'browser-workflows',
  'canonical-hashing',
  'dates-dst',
  'numbers-validation',
  'safe-objects',
  'typed-errors',
]);

describe('function API partition A', () => {
  it('documents exactly one entry for each of its 54 public /fns exports', () => {
    const documented = [...FUNCTION_A_DOCUMENTED_SYMBOLS].sort();
    const entries = FUNCTION_A_API_ENTRIES.map(entry => entry.symbol).sort();

    expect(FUNCTION_A_DOCUMENTED_SYMBOLS).toHaveLength(54);
    expect(new Set(FUNCTION_A_DOCUMENTED_SYMBOLS)).toHaveLength(54);
    expect(FUNCTION_A_API_ENTRIES).toHaveLength(54);
    expect(entries).toEqual(documented);
    expect(new Set(FUNCTION_A_API_ENTRIES.map(entry => entry.id))).toHaveLength(54);
  });

  it('pins every assigned symbol to the canonical /fns import path', () => {
    expect(Object.keys(FUNCTION_A_IMPORT_PATHS).sort()).toEqual(
      [...FUNCTION_A_DOCUMENTED_SYMBOLS].sort(),
    );
    expect(new Set(Object.values(FUNCTION_A_IMPORT_PATHS))).toEqual(
      new Set(['@sdcorejs/utils/fns']),
    );
    expect(FUNCTION_A_API_ENTRIES.every(entry => entry.importPath === '@sdcorejs/utils/fns')).toBe(true);
  });

  it('documents all 88 public utility namespace members without extras', () => {
    const namespaces = Object.entries(FUNCTION_A_NAMESPACE_MEMBERS);
    expect(namespaces.reduce((count, [, members]) => count + members.length, 0)).toBe(88);

    for (const [namespace, expectedMembers] of namespaces) {
      const entry = FUNCTION_A_API_ENTRIES.find(candidate => candidate.symbol === namespace);
      expect(entry?.kind).toBe('namespace');
      expect(entry?.members?.map(member => member.name)).toEqual([...expectedMembers]);
      expect(new Set(expectedMembers)).toHaveLength(expectedMembers.length);
      expect(new Set(entry?.members?.map(member => member.anchor))).toHaveLength(expectedMembers.length);
    }
  });

  it('keeps every entry and member bilingual with structured operational notes', () => {
    for (const entry of FUNCTION_A_API_ENTRIES) {
      expect(entry.signature.trim()).not.toBe('');
      expect(entry.summary.en.trim()).not.toBe('');
      expect(entry.summary.vi.trim()).not.toBe('');
      expect(entry.returns.en.trim()).not.toBe('');
      expect(entry.returns.vi.trim()).not.toBe('');
      expect(entry.runtimeNotes.en.length).toBeGreaterThan(0);
      expect(entry.runtimeNotes.vi.length).toBeGreaterThan(0);
      expect(entry.securityNotes.en.length).toBeGreaterThan(0);
      expect(entry.securityNotes.vi.length).toBeGreaterThan(0);
      expect(entry.parameters.every(item => item.description.en.trim() && item.description.vi.trim())).toBe(true);
      expect(entry.exampleIds.every(id => canonicalExamples.has(id))).toBe(true);

      for (const member of entry.members ?? []) {
        expect(member.signature.trim()).not.toBe('');
        expect(member.summary.en.trim()).not.toBe('');
        expect(member.summary.vi.trim()).not.toBe('');
        expect(member.returns.en.trim()).not.toBe('');
        expect(member.returns.vi.trim()).not.toBe('');
        expect(member.runtimeNotes.en.length).toBeGreaterThan(0);
        expect(member.runtimeNotes.vi.length).toBeGreaterThan(0);
        expect(member.securityNotes.en.length).toBeGreaterThan(0);
        expect(member.securityNotes.vi.length).toBeGreaterThan(0);
        expect(member.parameters.every(item => item.description.en.trim() && item.description.vi.trim())).toBe(true);
        expect(member.exampleIds.every(id => canonicalExamples.has(id))).toBe(true);
      }
    }
  });

  it('makes the critical compatibility and security boundaries explicit', () => {
    const bySymbol = new Map(FUNCTION_A_API_ENTRIES.map(entry => [entry.symbol, entry]));
    const stringMembers = bySymbol.get('StringUtilities')?.members ?? [];
    const browserMembers = bySymbol.get('BrowserUtilities')?.members ?? [];
    const uploadOptions = bySymbol.get('UploadOptions');

    expect(bySymbol.get('encrypt')?.deprecation?.replacement).toContain('encryptAesGcm');
    expect(bySymbol.get('addMiliseconds')?.deprecation?.replacement).toBe('addMilliseconds');
    expect(bySymbol.get('dayDiff')?.deprecation?.replacement).toContain('calendarDayDifference');
    expect(stringMembers.find(member => member.name === 'REGEX_UUID')?.runtimeNotes.en.join(' '))
      .toContain('Does not constrain UUID version');
    expect(stringMembers.find(member => member.name === 'obfuscate')?.securityNotes.en.join(' '))
      .toContain('no confidentiality');
    expect(browserMembers.find(member => member.name === 'detectIncognito')?.securityNotes.en.join(' '))
      .toContain('never a security');
    expect(uploadOptions?.properties?.find(property => property.name === 'maxSizeInMb')?.description.en)
      .toContain('Positive finite');
    expect(uploadOptions?.runtimeNotes.en.join(' ')).toContain('before the picker opens');
  });

  it('documents mask defaults, nullish semantics, Unicode capability, and display limits', () => {
    const stringEntry = FUNCTION_A_API_ENTRIES.find(entry => entry.symbol === 'StringUtilities');
    const mask = stringEntry?.members?.find(member => member.name === 'mask');
    const options = FUNCTION_A_API_ENTRIES.find(entry => entry.symbol === 'StringMaskOptions');
    expect(mask?.signature).toContain('T extends string ? string : T');
    expect(mask?.parameters.find(parameter => parameter.name === 'value')?.description.en).toContain('without reading options');
    expect(mask?.runtimeNotes.en.join(' ')).toContain('Intl.Segmenter');
    expect(mask?.runtimeNotes.en.join(' ')).toContain('1 to 1024');
    expect(mask?.securityNotes.en.join(' ')).toContain('no automatic sanitization of logs or JSON');
    expect(options?.properties?.map(property => [property.name, property.defaultValue])).toEqual([
      ['keepStart', '0'], ['keepEnd', '0'], ['maskLength', '4'],
    ]);
  });
});
