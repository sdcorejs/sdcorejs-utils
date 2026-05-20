/* eslint-disable @typescript-eslint/no-explicit-any */
import { NumberUtilities } from './number.fns';

const isDate = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'string') {
    if (value.length < 8) return false;
    const date1 = value.substring(0, 10);
    const date2 = value.substring(0, 9);
    const date3 = value.substring(0, 8);
    const regex1 = /^(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])(-|\/)(\d{4})$/;
    const regex2 = /^(\d{4})(-|\/)(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])$/;
    const result = regex1.test(date1) || regex2.test(date1) || regex1.test(date2) || regex2.test(date2) || regex1.test(date3) || regex2.test(date3);
    return result ? !isNaN(new Date(value).getTime()) : false;
  }
  return !isNaN(new Date(value).getTime());
};

const toFormat = (value: any, format: string): string => {
  if (!isDate(value)) return '';
  const isDatePart = (type: Intl.DateTimeFormatPart['type']): type is 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' =>
    ['year', 'month', 'day', 'hour', 'minute', 'second'].includes(type);
  const date = new Date(value);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(date);
  const map: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>> = {};
  parts.forEach(part => { if (isDatePart(part.type)) map[part.type] = part.value; });
  return format.replace('yyyy', map.year ?? '').replace('MM', map.month ?? '').replace('dd', map.day ?? '').replace('HH', map.hour ?? '').replace('mm', map.minute ?? '').replace('ss', map.second ?? '');
};

const addMiliseconds = (value: any, miliseconds: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setMilliseconds(date.getMilliseconds() + miliseconds);
  return date;
};

const addDays = (value: any, days: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const addHours = (value: any, hours: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return date;
};

const addMonths = (value: any, months: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

const begin = (value: any): Date | null => {
  if (!isDate(value)) return null;
  return new Date(toFormat(value, 'MM/dd/yyyy'));
};

const end = (value: any): Date | null => {
  if (!isDate(value)) return null;
  return addMiliseconds(begin(addDays(value, 1)), -1);
};

const equal = (date1: any, date2: any) => {
  if (!isDate(date1) && !isDate(date2)) return true;
  if (!isDate(date1) || !isDate(date2)) return false;
  return new Date(date1).getTime() === new Date(date2).getTime();
};

const dayDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  return Math.floor((new Date(date2).getTime() - new Date(date1).getTime()) / (24 * 3600 * 1000));
};

const monthDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  const d1Y = new Date(date1).getFullYear(), d2Y = new Date(date2).getFullYear();
  const d1M = new Date(date1).getMonth(), d2M = new Date(date2).getMonth();
  return d2M + 12 * d2Y - (d1M + 12 * d1Y);
};

const yearDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  return new Date(date2).getFullYear() - new Date(date1).getFullYear();
};

const age = (date1: any, date2: any) => {
  const diff = monthDiff(date1, date2);
  return diff == null ? null : NumberUtilities.round(diff / 12);
};

const parseFrom = (value: any, format: string) => {
  if (!value || !format) return null;
  value = value.toString();
  const dmy = format.includes('dd') && format.includes('MM') && format.includes('yyyy');
  const hms = format.includes('HH') || format.includes('mm') || format.includes('ss');
  let strDate = '';
  if (dmy) {
    const dd = value.substr(format.indexOf('dd'), 2);
    const MM = value.substr(format.indexOf('MM'), 2);
    const yyyy = value.substr(format.indexOf('yyyy'), 4);
    if (+yyyy > 0 && +MM > 0 && +dd > 0) strDate += `${MM}/${dd}/${yyyy}`;
    else return null;
  } else {
    const today = new Date();
    strDate += `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
  }
  if (hms) {
    const HH = format.includes('HH') ? value.substr(format.indexOf('HH'), 2) : '00';
    const mm = format.includes('mm') ? value.substr(format.indexOf('mm'), 2) : '00';
    const ss = format.includes('ss') ? value.substr(format.indexOf('ss'), 2) : '00';
    strDate += ` ${HH || '00'}:${mm || '00'}:${ss || '00'}`;
  }
  return isDate(strDate) ? new Date(strDate) : null;
};

const timeDifference = (previous: any, current: any = new Date()) => {
  if (!isDate(previous) || !isDate(current)) return '';
  const elapsed = new Date(current).getTime() - new Date(previous).getTime();
  const m = 60 * 1000, h = m * 60, d = h * 24, mo = d * 30, y = d * 365;
  if (elapsed < m) return `${Math.round(elapsed / 1000)} seconds ago`;
  if (elapsed < h) return `${Math.round(elapsed / m)} minutes ago`;
  if (elapsed < d) return `${Math.round(elapsed / h)} hours ago`;
  if (elapsed < mo) return `${Math.round(elapsed / d)} days ago`;
  if (elapsed < y) return `${Math.round(elapsed / mo)} months ago`;
  return `${Math.round(elapsed / y)} years ago`;
};

export const DateUtilities = {
  equal, dayDiff, monthDiff, yearDiff, age,
  parseFrom, isDate, toFormat,
  addMiliseconds, addHours, addDays, addMonths,
  begin, end, timeDifference,
};
