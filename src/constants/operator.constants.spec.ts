import { JSDOM } from 'jsdom';
import { afterAll, describe, expect, expectTypeOf, it } from 'vitest';
import type { Operator } from '../models/operator.model';
import { OPERATORS } from './operator.constants';

// Exact design fixtures from .sdcorejs/handoff/design-operator-icons/icons.md.
const SLASH = '<line x1="17" y1="5" x2="7" y2="19"/>';
const EQUAL = '<line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/>';
const CONTAIN = '<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="9" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>';
const START_WITH = '<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="5.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>';
const END_WITH = '<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="12.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>';
const IN = '<path d="M17 6.5h-4.5a5.5 5.5 0 0 0 0 11H17M7 12h9"/>';
const NULL_RING = '<circle cx="12" cy="12" r="6.5"/>';

const EXPECTED: readonly (readonly [Operator, string])[] = [
  ['EQUAL', EQUAL],
  ['NOT_EQUAL', EQUAL + SLASH],
  ['GREATER_THAN', '<polyline points="7,7 17,12 7,17"/>'],
  ['LESS_THAN', '<polyline points="17,7 7,12 17,17"/>'],
  ['GREATER_OR_EQUAL', '<polyline points="7,5 17,10 7,15"/><line x1="7" y1="19" x2="17" y2="19"/>'],
  ['LESS_OR_EQUAL', '<polyline points="17,5 7,10 17,15"/><line x1="7" y1="19" x2="17" y2="19"/>'],
  ['CONTAIN', CONTAIN],
  ['NOT_CONTAIN', CONTAIN + SLASH],
  ['START_WITH', START_WITH],
  ['NOT_START_WITH', START_WITH + SLASH],
  ['END_WITH', END_WITH],
  ['NOT_END_WITH', END_WITH + SLASH],
  ['IN', IN],
  ['NOT_IN', IN + SLASH],
  ['BETWEEN', '<line x1="7" y1="12" x2="17" y2="12"/><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>'],
  ['NULL', NULL_RING + SLASH],
  ['NOT_NULL', NULL_RING + '<circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/>'],
];

const dom = new JSDOM('');
const parser = new dom.window.DOMParser();
afterAll(() => dom.window.close());

function iconFor(value: Operator): string {
  const entry = OPERATORS.find(operator => operator.value === value);
  expect(entry, value).toBeDefined();
  return entry!.icon;
}

function parseIcon(icon: string): Element {
  const document = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`,
    'image/svg+xml',
  );
  expect(document.querySelector('parsererror')).toBeNull();
  return document.documentElement;
}

function numberAttribute(element: Element, name: string): number {
  expect(element.hasAttribute(name), `${element.localName}.${name}`).toBe(true);
  const value = Number(element.getAttribute(name));
  expect(Number.isFinite(value), name).toBe(true);
  return value;
}

function withinViewBox(...coordinates: number[]): void {
  for (const coordinate of coordinates) {
    expect(Number.isFinite(coordinate)).toBe(true);
    expect(coordinate).toBeGreaterThanOrEqual(0);
    expect(coordinate).toBeLessThanOrEqual(24);
  }
}

function checkBounds(element: Element): void {
  const n = (name: string) => numberAttribute(element, name);
  switch (element.localName) {
    case 'line':
      withinViewBox(n('x1'), n('y1'), n('x2'), n('y2'));
      break;
    case 'polyline': {
      const coordinates = element.getAttribute('points')!.split(/[\s,]+/).map(Number);
      expect(coordinates.length).toBeGreaterThanOrEqual(4);
      expect(coordinates.length % 2).toBe(0);
      withinViewBox(...coordinates);
      break;
    }
    case 'rect':
      expect(n('width')).toBeGreaterThan(0);
      expect(n('height')).toBeGreaterThan(0);
      withinViewBox(n('x'), n('y'), n('x') + n('width'), n('y') + n('height'), n('rx'));
      break;
    case 'circle':
      expect(n('r')).toBeGreaterThan(0);
      withinViewBox(n('cx') - n('r'), n('cx') + n('r'), n('cy') - n('r'), n('cy') + n('r'));
      break;
    case 'path': {
      // The handoff's only path is a left half-ellipse and two horizontal strokes.
      // Resolve relative h/a commands; their numeric arguments are not coordinates.
      const match = element.getAttribute('d')!.match(
        /^M([\d.]+) ([\d.]+)h(-?[\d.]+)a([\d.]+) ([\d.]+) 0 0 0 0 ([\d.]+)H([\d.]+)M([\d.]+) ([\d.]+)h(-?[\d.]+)$/,
      );
      expect(match).not.toBeNull();
      const [x, y, dx, rx, ry, dy, endX, barX, barY, barDx] = match!.slice(1).map(Number);
      expect(rx).toBeGreaterThan(0);
      expect(ry).toBeGreaterThan(0);
      expect(dy).toBe(2 * ry);
      withinViewBox(x, y, x + dx, x + dx - rx, y + dy, endX, barX, barY, barX + barDx);
      break;
    }
    default:
      throw new Error(`Unexpected SVG element: ${element.localName}`);
  }
}

describe('OPERATORS icon contract', () => {
  it('preserves all 17 distinct values, their order, and the public mutable array type', () => {
    expect(OPERATORS).toHaveLength(17);
    expect(new Set(OPERATORS.map(operator => operator.value)).size).toBe(17);
    expect(OPERATORS.map(operator => operator.value)).toEqual(EXPECTED.map(([value]) => value));
    expectTypeOf(OPERATORS).toEqualTypeOf<{ value: Operator; icon: string; display: string }[]>();
  });

  describe.each(EXPECTED)('%s', (value, expectedIcon) => {
    it('matches the exact approved SVG fragment', () => {
      expect(iconFor(value)).toBe(expectedIcon);
    });

    it('preserves the localization key', () => {
      expect(OPERATORS.find(operator => operator.value === value)!.display)
        .toBe(`core.operator.${value.toLowerCase().replaceAll('_', '-')}.display`);
    });

    it('parses as SVG containing only supported leaf elements', () => {
      const svg = parseIcon(iconFor(value));
      expect(svg.children.length).toBeGreaterThan(0);
      expect(svg.childNodes.length).toBe(svg.children.length);
      for (const element of svg.children) {
        expect(['line', 'polyline', 'rect', 'circle', 'path']).toContain(element.localName);
        expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(element.childNodes.length).toBe(0);
      }
    });

    it('keeps geometry within the 24-unit viewBox', () => {
      for (const element of parseIcon(iconFor(value)).children) checkBounds(element);
    });

    it('limits solid fills to small circles or segments', () => {
      for (const element of parseIcon(iconFor(value)).querySelectorAll('[fill]')) {
        expect(element.getAttribute('fill')).toBe('currentColor');
        expect(element.getAttribute('stroke')).toBe('none');
        expect(['circle', 'rect']).toContain(element.localName);
        if (element.localName === 'circle') {
          expect(numberAttribute(element, 'r')).toBeLessThanOrEqual(2.75);
        } else {
          expect(numberAttribute(element, 'width')).toBeLessThanOrEqual(6);
          expect(numberAttribute(element, 'height')).toBeLessThanOrEqual(4);
        }
      }
    });

    it('leaves stroke width and SVG sizing to the consumer', () => {
      for (const element of parseIcon(iconFor(value)).children) {
        expect(element.hasAttribute('stroke-width')).toBe(false);
        if (element.localName !== 'rect') {
          expect(element.hasAttribute('width')).toBe(false);
          expect(element.hasAttribute('height')).toBe(false);
        }
      }
    });

    it('uses exactly one shared slash for negation or NULL, except NOT_NULL', () => {
      const slashes = parseIcon(iconFor(value)).querySelectorAll('line[x1="17"][y1="5"][x2="7"][y2="19"]');
      const needsSlash = (value.startsWith('NOT_') && value !== 'NOT_NULL') || value === 'NULL';
      expect(slashes.length).toBe(needsSlash ? 1 : 0);
    });
  });

  it.each<readonly [Operator, Operator]>([
    ['NOT_EQUAL', 'EQUAL'],
    ['NOT_CONTAIN', 'CONTAIN'],
    ['NOT_START_WITH', 'START_WITH'],
    ['NOT_END_WITH', 'END_WITH'],
    ['NOT_IN', 'IN'],
  ])('%s is the unchanged %s glyph followed by the shared slash', (negated, base) => {
    expect(iconFor(negated)).toBe(iconFor(base) + SLASH);
  });

  it('uses a solid-outline empty-set glyph for NULL and a ring with a small dot for NOT_NULL', () => {
    expect(iconFor('NULL')).toBe(NULL_RING + SLASH);
    expect(iconFor('NOT_NULL')).toBe(NULL_RING + '<circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/>');
    expect(parseIcon(iconFor('NULL')).querySelector('[stroke-dasharray]')).toBeNull();
  });
});
