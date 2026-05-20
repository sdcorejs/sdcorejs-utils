import { detectIncognito } from './detect-incognito.fns';

// Hardcoded i18n cho upload — pure function nên không inject() được I18nService.
// Đọc lang trực tiếp từ localStorage (cùng key với I18nService: 'sd-core.language').
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
    const stored = localStorage.getItem('sd-core.language');
    if (stored && stored in UPLOAD_MESSAGES) return stored as UploadLang;
  } catch { /* ignore */ }
  return 'vi';
};

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

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const isMobile = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

const getClientPublicIp = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to fetch client IP:', error);
    return null;
  }
};

export const BrowserUtilities = {
  upload,
  download,
  downloadBlob,
  copyToClipboard,
  isMobile,
  getClientPublicIp,
  detectIncognito,
};
