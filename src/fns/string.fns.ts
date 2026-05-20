/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */

const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
const REGEX_PHONE = '^[+]*[(]{0,1}[+]?[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
const REGEX_VN_PHONE = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
const REGEX_VN_ID = '^\\d{12}$';
const REGEX_PASSPORT = '^[A-Z]\\d{7}$';
const REGEX_VN_ID_OR_PASSPORT = '^(\\d{12}|[A-Z]\\d{7})$';
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';

const REGEX_URL = '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$';
const REGEX_DOMAIN = '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$';
const REGEX_IPV4 = '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$';
const REGEX_IPV6 = '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$';
const REGEX_IMAGE_URL = '^https?:\\/\\/.+\\.(jpg|jpeg|png|gif|webp|svg|bmp)(\\?.*)?$';
const REGEX_SLUG = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
const REGEX_NUMBER = '^-?\\d+(\\.\\d+)?$';
const REGEX_INTEGER = '^-?\\d+$';
const REGEX_DECIMAL = '^-?\\d+\\.\\d+$';
const REGEX_POSITIVE_NUMBER = '^\\d+(\\.\\d+)?$';
const REGEX_UUID = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
const REGEX_CODE_16 = '^[A-Za-z0-9]{16}$';
const REGEX_CODE_32 = '^[A-Za-z0-9]{32}$';
const REGEX_HEX_COLOR = '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$';
const REGEX_BASE64 = '^[A-Za-z0-9+/]+=*$';


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
  REGEX_EMAIL, REGEX_PHONE, REGEX_VN_PHONE, REGEX_VN_ID, REGEX_PASSPORT, REGEX_VN_ID_OR_PASSPORT, REGEX_TIME,
  REGEX_URL, REGEX_DOMAIN, REGEX_IPV4, REGEX_IPV6, REGEX_IMAGE_URL, REGEX_SLUG,
  REGEX_NUMBER, REGEX_INTEGER, REGEX_DECIMAL, REGEX_POSITIVE_NUMBER,
  REGEX_UUID, REGEX_CODE_16, REGEX_CODE_32, REGEX_HEX_COLOR, REGEX_BASE64,
  changeAliasLowerCase, aliasIncludes,
  format, templateToDisplay, parseExpression,
  encrypt, decrypt,
  isNullOrEmpty, isNullOrWhiteSpace,
  convertToSnakeCaseCode, generateUniqueCode, sha256,
};
