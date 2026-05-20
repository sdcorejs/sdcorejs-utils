/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */

const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
const REGEX_PHONE = '^[+]*[(]{0,1}[+]?[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
const REGEX_PHONE_VN = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
const REGEX_IDVN = '^\\d{12}$';
const REGEX_PASSPORT = '^[A-Z]\\d{7}$';
const REGEX_IDVN_OR_PASSPORT = '^(\\d{12}|[A-Z]\\d{7})$';
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';

const isValidEmail = (value: any) => {
  if (!value) return false;
  return new RegExp(REGEX_EMAIL).test(value);
};

const isValidPhone = (value: any) => {
  if (!value) return false;
  return new RegExp(REGEX_PHONE).test(value);
};

const isValidCode = (value: any) => {
  if (!value) return false;
  return /^[a-zA-Z0-9\@\_\-]{2,20}$/.test(value);
};

const isNullOrEmpty = (value: any) => value === undefined || value === null || value === '';

const isNullOrWhiteSpace = (value: any) =>
  value === undefined || value === null || typeof value !== 'string' || value.match(/^\s*$/) !== null;

const changeAliasLowerCase = (alias: any) => {
  let str: string = alias?.toString() ?? '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  return str.trim();
};

const aliasIncludes = (alias: any, searchText: any) =>
  changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText));

const format = (template: string, ...arr: any[]) => {
  for (let i = 0; i < arr.length; i++) {
    template = template.replace(new RegExp(`\\{${i}\\}`, 'gi'), arr[i]);
  }
  return template;
};

const getValueByPath = (entity: Record<string, any>, key: string) => {
  let value: any = entity;
  for (const part of key.split('.')) value = value?.[part];
  return value;
};

const templateToDisplay = (template: string, entity: Record<string, any>) => {
  if (!template) return template;
  const regex = /\$\{([A-Za-z0-9._-]*)\}/g;
  for (const match of template.match(regex) || []) {
    const key = match.slice(2, match.length - 1);
    if (key) template = template.replace(match, getValueByPath(entity, key) ?? '');
  }
  return template;
};

const EXACT_TEMPLATE_REGEX = /^\$\{([A-Za-z0-9._-]*)\}$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

const parseExpression = (template: string, entity: Record<string, any>) => {
  if (!template) return undefined;
  const trimmed = template.trim();
  const exactMatch = trimmed.match(EXACT_TEMPLATE_REGEX);
  if (exactMatch?.[1]) return getValueByPath(entity, exactMatch[1]);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (NUMBER_LITERAL_REGEX.test(trimmed)) return Number(trimmed);
  return templateToDisplay(template, entity);
};

const SALT = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95';

const encrypt = (obj: any) => {
  const chars = JSON.stringify(obj).split('');
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '{') chars[i] = '}';
    else if (chars[i] === '}') chars[i] = '{';
  }
  return encodeURI(SALT + chars.join(''));
};

const decrypt = (encripted: string) => {
  encripted = decodeURI(encripted);
  if (encripted.indexOf(SALT) !== 0) throw new Error('object cannot be decrypted');
  const strs = encripted.substring(SALT.length).split('');
  for (let i = 0; i < strs.length; i++) {
    if (strs[i] === '{') strs[i] = '}';
    else if (strs[i] === '}') strs[i] = '{';
  }
  return JSON.parse(strs.join(''));
};

const convertToSnakeCaseCode = (name: string): string => {
  if (typeof name !== 'string') throw new Error('Invalid name');
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

const generateUniqueCode = (name: string, existingCodes: string[]): string => {
  const baseCode = convertToSnakeCaseCode(name);
  if (!existingCodes.includes(baseCode)) return baseCode;
  let index = 1;
  let newCode = `${baseCode}_${index}`;
  while (existingCodes.includes(newCode)) { index++; newCode = `${baseCode}_${index}`; }
  return newCode;
};

const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const StringUtilities = {
  REGEX_EMAIL, REGEX_PHONE, REGEX_PHONE_VN, REGEX_IDVN, REGEX_PASSPORT, REGEX_IDVN_OR_PASSPORT, REGEX_TIME,
  isValidEmail, isValidPhone, isValidCode,
  changeAliasLowerCase, aliasIncludes,
  format, templateToDisplay, parseExpression,
  encrypt, decrypt,
  isNullOrEmpty, isNullOrWhiteSpace,
  convertToSnakeCaseCode, generateUniqueCode, sha256,
};
