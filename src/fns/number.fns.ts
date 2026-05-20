/* eslint-disable @typescript-eslint/no-explicit-any */

const toVNCurrency = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('vi-VN', { maximumFractionDigits: 10 }) : null;
};

const toVN = toVNCurrency;

const toISO = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('en-US', { maximumFractionDigits: 10 }) : null;
};

const isPositiveInteger = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)$/.test(value) && +value > 0;
};

const isPositiveNumber = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)(\.[0-9]+$){0,1}$/.test(value) && +value > 0;
};

const isNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  return !Number.isNaN(+value);
};

const round = (value: any, digits = 2): number | null => {
  if (!NumberUtilities.isNumber(value)) return null;
  const val = Math.pow(10, digits);
  return Math.round(value * val) / val;
};

export const NumberUtilities = { toVNCurrency, toVN, toISO, isPositiveInteger, isPositiveNumber, isNumber, round };
