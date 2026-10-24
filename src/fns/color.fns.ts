/**
 * Converts HSL color components to a lowercase hexadecimal RGB color.
 *
 * Inputs are expected in the documented ranges; this legacy helper does not validate
 * or clamp HSL components. Out-of-range/non-finite inputs can produce malformed color
 * strings. The conversion has no DOM dependency and does not modify its arguments.
 *
 * @param h - Hue in degrees, normally 0 through 360.
 * @param s - Saturation percentage, 0 through 100.
 * @param l - Lightness percentage, 0 through 100.
 * @returns `#rrggbb` for valid components, rounding channels to the nearest integer.
 * @example
 * ColorUtilities.hslToHex(0, 100, 50); // '#ff0000'
 * ColorUtilities.hslToHex(0, 0, 50); // '#808080'
 */
function hslToHex(h: number, s: number, l: number): string {
  const hN = h / 360, sN = s / 100, lN = l / 100;
  let r: number, g: number, b: number;
  if (sN === 0) {
    r = g = b = lN;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
    const p = 2 * lN - q;
    r = hue2rgb(p, q, hN + 1 / 3);
    g = hue2rgb(p, q, hN);
    b = hue2rgb(p, q, hN - 1 / 3);
  }
  const toHex = (x: number) => { const h = Math.round(x * 255).toString(16); return h.length === 1 ? '0' + h : h; };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts RGB channels to a lowercase hexadecimal color without an alpha channel.
 *
 * Each channel is clamped to [0, 255] and rounded to the nearest integer. `NaN`
 * is not rejected and can produce a malformed string; validate untrusted data first.
 * No browser API or mutable state is involved.
 *
 * @param r - Red channel; finite values outside [0, 255] are clamped.
 * @param g - Green channel; fractional values are rounded.
 * @param b - Blue channel; fractional values are rounded.
 * @returns A `#rrggbb` string when all channels yield valid numbers.
 * @example
 * ColorUtilities.rgbToHex(255, 128, 0); // '#ff8000'
 * ColorUtilities.rgbToHex(-10, 300, 0); // '#00ff00'
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => { const h = Math.round(Math.max(0, Math.min(255, x))).toString(16); return h.length === 1 ? '0' + h : h; };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Dependency-free HSL/RGB color conversion helpers.
 *
 * These functions return color text, not CSS validation results. HSL assumes valid
 * components; RGB clamps channels. Neither helper supports alpha or color profiles.
 *
 * @example
 * import { ColorUtilities } from '@sdcorejs/utils/fns';
 * ColorUtilities.rgbToHex(0, 128, 255); // '#0080ff'
 */
export const ColorUtilities = {
  /**
   * Converts HSL color components to a lowercase hexadecimal RGB color.
   *
   * Inputs are expected in the documented ranges; this legacy helper does not validate
   * or clamp HSL components. Out-of-range/non-finite inputs can produce malformed color
   * strings. The conversion has no DOM dependency and does not modify its arguments.
   *
   * @param h - Hue in degrees, normally 0 through 360.
   * @param s - Saturation percentage, 0 through 100.
   * @param l - Lightness percentage, 0 through 100.
   * @returns `#rrggbb` for valid components, rounding channels to the nearest integer.
   * @example
   * ColorUtilities.hslToHex(0, 100, 50); // '#ff0000'
   * ColorUtilities.hslToHex(0, 0, 50); // '#808080'
   */
  hslToHex,
  /**
   * Converts RGB channels to a lowercase hexadecimal color without an alpha channel.
   *
   * Each channel is clamped to [0, 255] and rounded to the nearest integer. `NaN`
   * is not rejected and can produce a malformed string; validate untrusted data first.
   * No browser API or mutable state is involved.
   *
   * @param r - Red channel; finite values outside [0, 255] are clamped.
   * @param g - Green channel; fractional values are rounded.
   * @param b - Blue channel; fractional values are rounded.
   * @returns A `#rrggbb` string when all channels yield valid numbers.
   * @example
   * ColorUtilities.rgbToHex(255, 128, 0); // '#ff8000'
   * ColorUtilities.rgbToHex(-10, 300, 0); // '#00ff00'
   */
  rgbToHex,
};
