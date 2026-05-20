import { SD_LANGUAGE_STORAGE_KEY } from '../constants/common.constants';
import { detectIncognito } from './detect-incognito.fns';

// Hardcoded i18n cho upload — pure function nên không inject() được I18nService.
// Đọc lang trực tiếp từ localStorage (cùng key với I18nService: SD_LANGUAGE_STORAGE_KEY).
// Khi I18nService chuyển sang reload-on-change model, lang ở đây luôn đồng bộ với UI.
const UPLOAD_MESSAGES = {
  vi: {
    'invalid-format': '[{name}] File tải lên không đúng định dạng. Vui lòng chọn lại',
    'invalid-size': '[{name}] Kích thước file không hợp lệ. Vui lòng chọn một file khác',
  },
  en: {
    'invalid-format': '[{name}] Invalid file format. Please select again',
    'invalid-size': '[{name}] Invalid file size. Please choose a different file',
  },
  ja: {
    'invalid-format': '[{name}] ファイル形式が正しくありません。もう一度選択してください',
    'invalid-size': '[{name}] ファイルサイズが正しくありません。別のファイルを選択してください',
  },
  ko: {
    'invalid-format': '[{name}] 파일 형식이 올바르지 않습니다. 다시 선택해 주세요',
    'invalid-size': '[{name}] 파일 크기가 올바르지 않습니다. 다른 파일을 선택해 주세요',
  },
  zh: {
    'invalid-format': '[{name}] 文件格式不正确，请重新选择',
    'invalid-size': '[{name}] 文件大小不符合要求，请选择其他文件',
  },
} as const;

type UploadMsgKey = keyof typeof UPLOAD_MESSAGES.vi;
type UploadLang = keyof typeof UPLOAD_MESSAGES;

const getUploadLang = (): UploadLang => {
  try {
    const stored = localStorage.getItem(SD_LANGUAGE_STORAGE_KEY);
    if (stored && stored in UPLOAD_MESSAGES) return stored as UploadLang;
  } catch { /* ignore */ }
  return 'vi';
};

/**
 * Opens the native file picker and resolves with the selected file(s) after validation.
 *
 * @param option.extensions - Allowed file extensions, e.g. `['pdf', 'docx']`. Case-insensitive.
 * @param option.maxSizeInMb - Maximum file size in megabytes.
 * @param option.validator - Custom validator: receives the file name and returns an error message string if invalid.
 * @param option.multiple - Allow selecting multiple files (returns `File[]`).
 * @returns A Promise resolving to `File`, `File[]`, or `null` if no file was selected.
 * @throws `Error` with a localized message if extension or size validation fails.
 *
 * @example
 * // Single file, PDF only, max 5 MB
 * const file = await BrowserUtilities.upload({ extensions: ['pdf'], maxSizeInMb: 5 });
 *
 * // Multiple images
 * const files = await BrowserUtilities.upload({ extensions: ['jpg', 'png', 'webp'], multiple: true });
 */
const upload = (option?: { extensions?: string[]; maxSizeInMb?: number; validator?: (fileName: string) => string; multiple?: boolean }) => {
  const uploadId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
  const promise = new Promise<File | File[] | null>((resolve, reject) => {
    const body = document.getElementsByTagName('body')?.[0];
    if (!body) {
      resolve(null);
      return;
    }
    const existedElement = document.getElementById(uploadId);
    if (existedElement) {
      existedElement.remove();
    }
    const element = document.createElement('input');
    element.setAttribute('id', uploadId);
    element.setAttribute('type', 'file');
    if (option?.multiple) {
      element.setAttribute('multiple', '');
    }
    element.style.display = 'none';
    body.appendChild(element);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element.addEventListener('change', (evt: any) => {
      try {
        const target = evt.target as DataTransfer;

        const throwUploadError = (msgKey: UploadMsgKey, name: string): never => {
          const lang = getUploadLang();
          const template = UPLOAD_MESSAGES[lang][msgKey] ?? UPLOAD_MESSAGES.vi[msgKey];
          throw new Error(template.replace('{name}', name));
        };

        if (option?.multiple) {
          const files: File[] = [];
          for (const file of Array.from(target.files)) {
            if (file) {
              const lastDot = file.name.lastIndexOf('.');
              if (lastDot === -1) {
                throwUploadError('invalid-format', file.name);
              }
              const extension = file.name.substring(lastDot + 1);
              if (option) {
                if (option.extensions?.length && !option.extensions.some(e => e.toLowerCase() === extension.toLowerCase())) {
                  throwUploadError('invalid-format', file.name);
                }
                if (option.maxSizeInMb && option.maxSizeInMb > 0 && option.maxSizeInMb * 1024 * 1024 < file.size) {
                  throwUploadError('invalid-size', file.name);
                }
                if (option.validator && option.validator(file.name)) {
                  // Custom validator returns its own message — pass through as-is (caller defines format).
                  const message = option.validator(file.name);
                  throw new Error(message);
                }
              }
              files.push(file);
            }
          }
          resolve(files);
        } else {
          const file = target.files.item(0);
          if (file) {
            const lastDot = file.name.lastIndexOf('.');
            if (lastDot === -1) {
              throwUploadError('invalid-format', file.name);
            }
            const extension = file.name.substring(lastDot + 1);
            if (option) {
              if (option.extensions?.length && !option.extensions.some(e => e.toLowerCase() === extension.toLowerCase())) {
                throwUploadError('invalid-format', file.name);
              }
              if (option.maxSizeInMb && option.maxSizeInMb > 0 && option.maxSizeInMb * 1024 * 1024 < file.size) {
                throwUploadError('invalid-size', file.name);
              }
              if (option.validator && option.validator(file.name)) {
                const message = option.validator(file.name);
                throw new Error(message);
              }
            }
            resolve(file);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
    element.click();
  });
  return promise;
};

const generateFileName = (fileName?: string | null) => {
  if (!fileName) {
    const id = `${new Date().getTime().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
    return `file_${id}`;
  }
  return fileName;
};

/**
 * Triggers a browser download for a `File` object or a URL string.
 * - URLs starting with `http` are opened in a new tab.
 * - All other strings (blob URLs, data URIs, relative paths) trigger a file download.
 *
 * @param fileOrPath - `File` object or URL/path string.
 * @param fileName - Override for the downloaded file name.
 *
 * @example
 * BrowserUtilities.download(file);                        // use file.name
 * BrowserUtilities.download(file, 'export.pdf');          // override name
 * BrowserUtilities.download('https://example.com/report'); // opens in new tab
 * BrowserUtilities.download('/api/export?format=csv', 'data.csv');
 */
const download = (fileOrPath: File | string | undefined | null, fileName?: string | null) => {
  if (!fileOrPath) {
    console.warn('No file or path provided for download');
    return;
  }
  fileName = generateFileName(fileName);
  if (fileOrPath instanceof File) {
    const url = URL.createObjectURL(fileOrPath);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileOrPath.name || fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  const a = document.createElement('a');
  a.href = fileOrPath;
  if (fileOrPath.startsWith('http')) {
    a.target = '_blank';
  } else {
    a.download = fileName;
  }
  a.style.visibility = 'hidden';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 * Triggers a browser download for a `Blob` object.
 *
 * @param blob - The Blob to download.
 * @param fileName - File name for the download; auto-generated if omitted.
 *
 * @example
 * const blob = new Blob(['hello, world'], { type: 'text/plain' });
 * BrowserUtilities.downloadBlob(blob, 'greeting.txt');
 */
const downloadBlob = (blob: Blob, fileName?: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    if (link.download !== undefined) {
      link.download = generateFileName(fileName);
      link.href = url;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    }
  } catch (e) {
    console.error('BlobToSaveAs error', e);
  }
};

/**
 * Writes text to the clipboard using the Clipboard API.
 *
 * @param text - The string to copy.
 *
 * @example
 * BrowserUtilities.copyToClipboard('https://example.com/share-link');
 */
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

/**
 * Returns `true` if the current device is likely a mobile device
 * based on the user agent string.
 *
 * @example
 * if (BrowserUtilities.isMobile()) {
 *   // render compact layout
 * }
 */
const isMobile = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};


/**
 * Browser-specific utilities: file upload/download, clipboard, device detection,
 * and cross-browser private-mode detection.
 *
 * @example
 * import { BrowserUtilities } from '@sdcorejs/utils/fns';
 *
 * const file = await BrowserUtilities.upload({ extensions: ['pdf'] });
 * const { isPrivate } = await BrowserUtilities.detectIncognito();
 */
export const BrowserUtilities = {
  upload,
  download,
  downloadBlob,
  copyToClipboard,
  isMobile,
  /**
   * Detects whether the browser is running in private/incognito mode.
   * Works across Chrome, Edge, Firefox, Safari, and IE.
   *
   * @returns `Promise<{ isPrivate: boolean, browserName: string }>`
   *
   * @example
   * const { isPrivate, browserName } = await BrowserUtilities.detectIncognito();
   * if (isPrivate) console.log(`${browserName} is in private mode`);
   */
  detectIncognito,
};
