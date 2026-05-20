import { describe, it, expect } from 'vitest';
import { ColorUtilities } from './color.fns';

// ─── hslToHex ────────────────────────────────────────────────────────────────

describe('ColorUtilities.hslToHex', () => {
  it('converts pure red (0, 100, 50) to #ff0000', () => {
    expect(ColorUtilities.hslToHex(0, 100, 50)).toBe('#ff0000');
  });

  it('converts pure green (120, 100, 50) to #00ff00', () => {
    expect(ColorUtilities.hslToHex(120, 100, 50)).toBe('#00ff00');
  });

  it('converts pure blue (240, 100, 50) to #0000ff', () => {
    expect(ColorUtilities.hslToHex(240, 100, 50)).toBe('#0000ff');
  });

  it('converts white (0, 0, 100) to #ffffff', () => {
    expect(ColorUtilities.hslToHex(0, 0, 100)).toBe('#ffffff');
  });

  it('converts black (0, 0, 0) to #000000', () => {
    expect(ColorUtilities.hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts mid grey (0, 0, 50) to a valid hex close to #808080', () => {
    const result = ColorUtilities.hslToHex(0, 0, 50);
    // Must be a well-formed 6-digit hex colour
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    // R = G = B should each be ~128 (0x80)
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    expect(r).toBe(g);
    expect(g).toBe(b);
    // Allow ±1 rounding tolerance
    expect(Math.abs(r - 128)).toBeLessThanOrEqual(1);
  });

  it('converts yellow (60, 100, 50) to #ffff00', () => {
    expect(ColorUtilities.hslToHex(60, 100, 50)).toBe('#ffff00');
  });

  it('converts cyan (180, 100, 50) to #00ffff', () => {
    expect(ColorUtilities.hslToHex(180, 100, 50)).toBe('#00ffff');
  });

  it('converts magenta (300, 100, 50) to #ff00ff', () => {
    expect(ColorUtilities.hslToHex(300, 100, 50)).toBe('#ff00ff');
  });

  it('always returns a string starting with #', () => {
    expect(ColorUtilities.hslToHex(30, 50, 60)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

// ─── rgbToHex ────────────────────────────────────────────────────────────────

describe('ColorUtilities.rgbToHex', () => {
  it('converts pure red (255, 0, 0) to #ff0000', () => {
    expect(ColorUtilities.rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('converts pure green (0, 255, 0) to #00ff00', () => {
    expect(ColorUtilities.rgbToHex(0, 255, 0)).toBe('#00ff00');
  });

  it('converts pure blue (0, 0, 255) to #0000ff', () => {
    expect(ColorUtilities.rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  it('converts white (255, 255, 255) to #ffffff', () => {
    expect(ColorUtilities.rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts black (0, 0, 0) to #000000', () => {
    expect(ColorUtilities.rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('clamps out-of-range values: (300, -10, 128) → #ff0080', () => {
    // 300 clamps to 255 → ff, -10 clamps to 0 → 00, 128 stays → 80
    expect(ColorUtilities.rgbToHex(300, -10, 128)).toBe('#ff0080');
  });

  it('clamps upper bound: (256, 256, 256) → #ffffff', () => {
    expect(ColorUtilities.rgbToHex(256, 256, 256)).toBe('#ffffff');
  });

  it('clamps lower bound: (-1, -100, -255) → #000000', () => {
    expect(ColorUtilities.rgbToHex(-1, -100, -255)).toBe('#000000');
  });

  it('rounds fractional values correctly: (127.6, 0, 0) → #800000', () => {
    // Math.round(127.6) = 128 = 0x80
    expect(ColorUtilities.rgbToHex(127.6, 0, 0)).toBe('#800000');
  });

  it('always returns a lowercase 6-digit hex string', () => {
    const result = ColorUtilities.rgbToHex(100, 150, 200);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('converts mid-grey (128, 128, 128) to #808080', () => {
    expect(ColorUtilities.rgbToHex(128, 128, 128)).toBe('#808080');
  });
});
