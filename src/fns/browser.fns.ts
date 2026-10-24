import { SD_LANGUAGE_STORAGE_KEY } from '../constants/common.constants';
import { FilePickerCancelledError, UnsafeUrlProtocolError, ValidationError } from '../errors';
import { detectIncognito } from './detect-incognito.fns';

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

/** Options for a single isolated native file-picker invocation. */
export interface UploadOptions {
  /**
   * Allowed final filename extensions, matched case-insensitively; a leading dot is tolerated.
   * Omitted or empty means no extension restriction. Also builds the native accept hint unless
   * accept is supplied. Multi-part names are checked by the final suffix; content is not inspected.
   */
  extensions?: string[];
  /**
   * Native file-picker accept hint (MIME types and/or dotted extensions), derived from extensions
   * when omitted. Supplying it does not change extension validation or verify the selected file's content.
   */
  accept?: string;
  /**
   * Per-file size limit in MiB (1,048,576 bytes), inclusive. Omitted means no size limit.
   * Must be positive and finite, including after conversion to bytes. Size validation runs first.
   */
  maxSizeInMb?: number;
  /**
   * Optional synchronous filename validator, run after size/extension checks. A nonempty returned
   * string rejects with ValidationError; empty/undefined/void permits the file. Thrown errors
   * reject unchanged. For content/metadata inspection use fileValidator; async validators are unsupported.
   *
   * @param fileName - Original selected filename, including extension.
   * @returns Error message to reject the selection, or no message to continue validation.
   * @example const options: UploadOptions = { validator: name => name.startsWith('.') ? 'Hidden files are not accepted' : undefined };
   */
  validator?: (fileName: string) => string | undefined | void;
  /**
   * Optional synchronous full-file validator, run after the filename validator. A nonempty
   * message rejects with ValidationError; thrown errors reject unchanged. It receives a File
   * but does not automatically read bytes; asynchronous validation is unsupported here.
   *
   * @param file - Original File object selected by the user.
   * @returns Error message to reject, or empty/undefined/void to accept.
   * @example const options: UploadOptions = { fileValidator: file => file.size === 0 ? 'Empty file' : undefined };
   */
  fileValidator?: (file: File) => string | undefined | void;
  /**
   * Positive finite maximum wait in milliseconds, default 300,000 (five minutes).
   * Expiry rejects with FilePickerCancelledError and removes picker resources; browser timer
   * scheduling can delay actual settlement beyond the requested duration.
   */
  timeoutMs?: number;
  /**
   * Select multiple files, default false. Literal true gives a Promise<File[]> overload;
   * false/omitted gives Promise<File>. Every selected file must validate before resolution.
   */
  multiple?: boolean;
}

/** Protocol policy for browser download links. */
export interface DownloadOptions {
  /** Allows a `data:` URL. Disabled by default because it may carry active content. */
  allowDataUrl?: boolean;
  /**
   * Additional explicitly trusted protocols. Defaults to none. This option cannot
   * enable `data:`, `javascript:`, or `vbscript:`; use `allowDataUrl` for `data:`.
   */
  additionalProtocols?: readonly string[];
}

const getUploadLang = (): UploadLang => {
  try {
    const stored = localStorage.getItem(SD_LANGUAGE_STORAGE_KEY);
    if (stored && stored in UPLOAD_MESSAGES) return stored as UploadLang;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return 'vi';
};

let pickerSequence = 0;

/**
 * Opens an isolated native file picker and validates each selected file before resolving.
 * Requires a browser with `document.body` and usually a user gesture. Size, extension,
 * filename validator, and full-file validator run in that order; all files must pass.
 * The temporary input, listeners, and timer are removed on settlement. File extensions
 * and picker hints do not verify file content; perform trusted content validation separately.
 *
 * @param option - Selection and validation settings. Defaults to one file, unrestricted
 *   extension/size, and a 300,000 ms timeout. `multiple: true` selects the array overload.
 * @returns A Promise of a File, or File[] for multiple selection; no bytes are uploaded.
 * @throws {ValidationError} Rejects invalid options, unavailable DOM, or a failed validation.
 * @throws {FilePickerCancelledError} Rejects cancel events, empty selection, or timeout.
 * @throws Rejects exceptions raised by custom validators or picker setup.
 * @example
 * const files = await BrowserUtilities.upload({ multiple: true, extensions: ['pdf'], maxSizeInMb: 10 });
 * files.map(file => file.name);
 */
function upload(option: UploadOptions & { multiple: true }): Promise<File[]>;
/**
 * Opens an isolated native file picker and validates each selected file before resolving.
 * Requires a browser with `document.body` and usually a user gesture. Size, extension,
 * filename validator, and full-file validator run in that order; all files must pass.
 * The temporary input, listeners, and timer are removed on settlement. File extensions
 * and picker hints do not verify file content; perform trusted content validation separately.
 *
 * @param option - Selection and validation settings. Defaults to one file, unrestricted
 *   extension/size, and a 300,000 ms timeout. `multiple: true` selects the array overload.
 * @returns A Promise of a File, or File[] for multiple selection; no bytes are uploaded.
 * @throws {ValidationError} Rejects invalid options, unavailable DOM, or a failed validation.
 * @throws {FilePickerCancelledError} Rejects cancel events, empty selection, or timeout.
 * @throws Rejects exceptions raised by custom validators or picker setup.
 * @example
 * const files = await BrowserUtilities.upload({ multiple: true, extensions: ['pdf'], maxSizeInMb: 10 });
 * files.map(file => file.name);
 */
function upload(option?: UploadOptions & { multiple?: false | undefined }): Promise<File>;
/**
 * Opens an isolated native file picker and validates each selected file before resolving.
 * Requires a browser with `document.body` and usually a user gesture. Size, extension,
 * filename validator, and full-file validator run in that order; all files must pass.
 * The temporary input, listeners, and timer are removed on settlement. File extensions
 * and picker hints do not verify file content; perform trusted content validation separately.
 *
 * @param option - Selection and validation settings. Defaults to one file, unrestricted
 *   extension/size, and a 300,000 ms timeout. `multiple: true` selects the array overload.
 * @returns A Promise of a File, or File[] for multiple selection; no bytes are uploaded.
 * @throws {ValidationError} Rejects invalid options, unavailable DOM, or a failed validation.
 * @throws {FilePickerCancelledError} Rejects cancel events, empty selection, or timeout.
 * @throws Rejects exceptions raised by custom validators or picker setup.
 * @example
 * const files = await BrowserUtilities.upload({ multiple: true, extensions: ['pdf'], maxSizeInMb: 10 });
 * files.map(file => file.name);
 */
function upload(option?: UploadOptions): Promise<File | File[]>;
/**
 * Opens an isolated native file picker and validates each selected file before resolving.
 * Requires a browser with `document.body` and usually a user gesture. Size, extension,
 * filename validator, and full-file validator run in that order; all files must pass.
 * The temporary input, listeners, and timer are removed on settlement. File extensions
 * and picker hints do not verify file content; perform trusted content validation separately.
 *
 * @param option - Selection and validation settings. Defaults to one file, unrestricted
 *   extension/size, and a 300,000 ms timeout. `multiple: true` selects the array overload.
 * @returns A Promise of a File, or File[] for multiple selection; no bytes are uploaded.
 * @throws {ValidationError} Rejects invalid options, unavailable DOM, or a failed validation.
 * @throws {FilePickerCancelledError} Rejects cancel events, empty selection, or timeout.
 * @throws Rejects exceptions raised by custom validators or picker setup.
 * @example
 * const files = await BrowserUtilities.upload({ multiple: true, extensions: ['pdf'], maxSizeInMb: 10 });
 * files.map(file => file.name);
 */
function upload(option: UploadOptions = {}): Promise<File | File[]> {
  return new Promise((resolve, reject) => {
    const requestedMaxSize = option.maxSizeInMb;
    const maxSizeInBytes = requestedMaxSize === undefined
      ? undefined
      : requestedMaxSize * 1024 * 1024;
    if (
      requestedMaxSize !== undefined
      && (!Number.isFinite(requestedMaxSize) || requestedMaxSize <= 0 || !Number.isFinite(maxSizeInBytes))
    ) {
      reject(new ValidationError('maxSizeInMb must be a positive finite number'));
      return;
    }
    const requestedTimeout = option.timeoutMs ?? 300_000;
    if (!Number.isFinite(requestedTimeout) || requestedTimeout <= 0) {
      reject(new ValidationError('timeoutMs must be a positive finite number'));
      return;
    }
    if (typeof document === 'undefined' || !document.body) {
      reject(new ValidationError('The file picker requires document.body'));
      return;
    }

    const input = document.createElement('input');
    input.id = `sdcore-file-picker-${Date.now().toString(36)}-${++pickerSequence}`;
    input.type = 'file';
    input.multiple = option.multiple === true;
    input.style.display = 'none';
    const accept = option.accept ?? option.extensions?.map(extension => `.${extension.replace(/^\./, '')}`).join(',');
    if (accept) input.accept = accept;

    let settled = false;
    const timeout = setTimeout(() => fail(new FilePickerCancelledError()), requestedTimeout);

    const cleanup = (): void => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      clearTimeout(timeout);
      input.remove();
    };
    const succeed = (value: File | File[]): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const uploadError = (key: UploadMsgKey, name: string): ValidationError => {
      const lang = getUploadLang();
      return new ValidationError(UPLOAD_MESSAGES[lang][key].replace('{name}', name));
    };
    const validate = (file: File): void => {
      // Size is deliberately checked before format and custom validators.
      if (maxSizeInBytes !== undefined && file.size > maxSizeInBytes) {
        throw uploadError('invalid-size', file.name);
      }
      if (option.extensions?.length) {
        const dot = file.name.lastIndexOf('.');
        const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
        if (!extension || !option.extensions.some(item => item.replace(/^\./, '').toLowerCase() === extension)) {
          throw uploadError('invalid-format', file.name);
        }
      }
      const filenameMessage = option.validator?.(file.name);
      if (filenameMessage) throw new ValidationError(filenameMessage);
      const fileMessage = option.fileValidator?.(file);
      if (fileMessage) throw new ValidationError(fileMessage);
    };
    const selectedFiles = (): File[] => Array.from(input.files ?? []);
    function onChange(): void {
      try {
        const files = selectedFiles();
        if (files.length === 0) {
          fail(new FilePickerCancelledError());
          return;
        }
        files.forEach(validate);
        succeed(option.multiple ? files : files[0]);
      } catch (error) {
        fail(error);
      }
    }
    function onCancel(): void {
      fail(new FilePickerCancelledError());
    }
    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    document.body.appendChild(input);
    try {
      input.click();
    } catch (error) {
      fail(error);
    }
  });
}

const generateFileName = (fileName?: string | null): string => {
  if (fileName) return fileName;
  const id = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  return `file_${id}`;
};

const clickDownloadLink = (href: string, fileName?: string, openInNewTab = false): void => {
  const link = document.createElement('a');
  try {
    link.href = href;
    link.style.visibility = 'hidden';
    if (openInNewTab) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.download = generateFileName(fileName);
    }
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
  }
};

const ACTIVE_DOWNLOAD_PROTOCOLS = new Set(['javascript:', 'vbscript:']);

const normalizeAdditionalProtocol = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new ValidationError('additionalProtocols must contain valid protocol names');
  }
  const protocol = (value.endsWith(':') ? value : `${value}:`).toLowerCase();
  if (!/^[a-z][a-z\d+.-]*:$/u.test(protocol)) {
    throw new ValidationError('additionalProtocols must contain valid protocol names');
  }
  return protocol;
};

const parseDownloadUrl = (value: string, options: DownloadOptions): { href: string; openInNewTab: boolean } => {
  if (!value || value !== value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new ValidationError('Malformed download URL');
  }
  let url: URL;
  try {
    url = new URL(value, window.location.href);
  } catch (cause) {
    throw new ValidationError('Malformed download URL', { cause });
  }
  const protocol = url.protocol.toLowerCase();
  const additionalProtocols = (options.additionalProtocols ?? []).map(normalizeAdditionalProtocol);
  if (ACTIVE_DOWNLOAD_PROTOCOLS.has(protocol)) throw new UnsafeUrlProtocolError(protocol);
  const allowed = protocol === 'http:' || protocol === 'https:' || protocol === 'blob:' ||
    (protocol === 'data:' && options.allowDataUrl === true) ||
    (protocol !== 'data:' && additionalProtocols.includes(protocol));
  if (!allowed) throw new UnsafeUrlProtocolError(protocol);

  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/iu.test(value);
  if (!hasExplicitScheme && url.origin !== window.location.origin) {
    throw new UnsafeUrlProtocolError(protocol);
  }
  return {
    href: url.href,
    openInNewTab: hasExplicitScheme && (protocol === 'http:' || protocol === 'https:'),
  };
};

/**
 * Triggers a browser download or opens an explicit HTTP(S) URL in a new tab.
 * File inputs use a temporary object URL, revoked after the click. Relative URLs must
 * remain on the current origin; absolute HTTP(S) links use `noopener noreferrer`.
 * `blob:` is permitted; `data:` requires opt-in; JavaScript/VBScript URLs are always rejected.
 * Requires browser DOM/URL APIs. A click does not guarantee the browser completes a download.
 *
 * @param fileOrPath - File or URL/path; null, undefined, and empty text are no-ops.
 * @param fileName - Suggested filename; defaults to the File name or a generated filename.
 *   Browsers control actual naming, and new-tab HTTP(S) links do not use this suggestion.
 * @param options - Protocol allowlist extensions; no additional protocols by default.
 * @returns Nothing; performs a DOM click and removes its temporary link.
 * @throws {ValidationError} For malformed URLs or protocol configuration.
 * @throws {UnsafeUrlProtocolError} For disallowed protocols or cross-origin relative URLs.
 * @throws Propagates unavailable browser API or DOM errors.
 * @example BrowserUtilities.download('/reports/monthly.csv', 'report.csv');
 */
const download = (
  fileOrPath: File | string | undefined | null,
  fileName?: string | null,
  options: DownloadOptions = {}
): void => {
  if (!fileOrPath) return;
  if (typeof File !== 'undefined' && fileOrPath instanceof File) {
    const url = URL.createObjectURL(fileOrPath);
    try {
      clickDownloadLink(url, fileName ?? fileOrPath.name);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  const parsed = parseDownloadUrl(fileOrPath as string, options);
  clickDownloadLink(parsed.href, fileName ?? undefined, parsed.openInNewTab);
};

/**
 * Triggers a browser download of Blob bytes using a temporary object URL.
 * The link is removed and the object URL revoked after the click, even when clicking fails.
 * Requires browser DOM and object-URL support; completion is controlled by the browser.
 *
 * @param blob - Blob or File whose bytes should be downloaded.
 * @param fileName - Suggested filename; a timestamp-based name is generated when omitted.
 * @returns Nothing; does not wait for a completed download.
 * @throws Propagates object-URL and DOM failures.
 * @example BrowserUtilities.downloadBlob(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
 */
const downloadBlob = (blob: Blob, fileName?: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    clickDownloadLink(url, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Writes plain text using the browser Clipboard API, without a legacy fallback.
 * Requires `navigator.clipboard`; browser permissions, secure-context rules, and user activation apply.
 *
 * @param text - Text to place on the system clipboard.
 * @returns A Promise resolving after the browser accepts the write.
 * @throws Rejects when the API is absent, permission is denied, or the browser write fails.
 * @example await BrowserUtilities.copyToClipboard('Copied text');
 */
const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

/**
 * Checks the user-agent string for `Mobi` or `Android`, ignoring case.
 * This is a heuristic, not viewport, touch, capability, or reliable device detection.
 *
 * @returns Whether the browser user-agent matches the heuristic.
 * @throws {ReferenceError} Outside environments providing `navigator`.
 * @example BrowserUtilities.isMobile(); // Depends on navigator.userAgent.
 */
const isMobile = (): boolean => /Mobi|Android/i.test(navigator.userAgent);

/**
 * Browser-only file, clipboard, and user-agent helpers. Importing the namespace is safe
 * without DOM globals, but calling a member requires the APIs documented on that member.
 *
 * @example
 * import { BrowserUtilities } from '@sdcorejs/utils/fns';
 * await BrowserUtilities.copyToClipboard('hello');
 */
export const BrowserUtilities = {
  /**
   * Opens an isolated native file picker and validates each selected file before resolving.
   * Requires a browser with `document.body` and usually a user gesture. Size, extension,
   * filename validator, and full-file validator run in that order; all files must pass.
   * The temporary input, listeners, and timer are removed on settlement. File extensions
   * and picker hints do not verify file content; perform trusted content validation separately.
   *
   * @param option - Selection and validation settings. Defaults to one file, unrestricted
   *   extension/size, and a 300,000 ms timeout. `multiple: true` selects the array overload.
   * @returns A Promise of a File, or File[] for multiple selection; no bytes are uploaded.
   * @throws {ValidationError} Rejects invalid options, unavailable DOM, or a failed validation.
   * @throws {FilePickerCancelledError} Rejects cancel events, empty selection, or timeout.
   * @throws Rejects exceptions raised by custom validators or picker setup.
   * @example
   * const files = await BrowserUtilities.upload({ multiple: true, extensions: ['pdf'], maxSizeInMb: 10 });
   * files.map(file => file.name);
   */
  upload,
  /**
   * Triggers a browser download or opens an explicit HTTP(S) URL in a new tab.
   * File inputs use a temporary object URL, revoked after the click. Relative URLs must
   * remain on the current origin; absolute HTTP(S) links use `noopener noreferrer`.
   * `blob:` is permitted; `data:` requires opt-in; JavaScript/VBScript URLs are always rejected.
   * Requires browser DOM/URL APIs. A click does not guarantee the browser completes a download.
   *
   * @param fileOrPath - File or URL/path; null, undefined, and empty text are no-ops.
   * @param fileName - Suggested filename; defaults to the File name or a generated filename.
   *   Browsers control actual naming, and new-tab HTTP(S) links do not use this suggestion.
   * @param options - Protocol allowlist extensions; no additional protocols by default.
   * @returns Nothing; performs a DOM click and removes its temporary link.
   * @throws {ValidationError} For malformed URLs or protocol configuration.
   * @throws {UnsafeUrlProtocolError} For disallowed protocols or cross-origin relative URLs.
   * @throws Propagates unavailable browser API or DOM errors.
   * @example BrowserUtilities.download('/reports/monthly.csv', 'report.csv');
   */
  download,
  /**
   * Triggers a browser download of Blob bytes using a temporary object URL.
   * The link is removed and the object URL revoked after the click, even when clicking fails.
   * Requires browser DOM and object-URL support; completion is controlled by the browser.
   *
   * @param blob - Blob or File whose bytes should be downloaded.
   * @param fileName - Suggested filename; a timestamp-based name is generated when omitted.
   * @returns Nothing; does not wait for a completed download.
   * @throws Propagates object-URL and DOM failures.
   * @example BrowserUtilities.downloadBlob(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
   */
  downloadBlob,
  /**
   * Writes plain text using the browser Clipboard API, without a legacy fallback.
   * Requires `navigator.clipboard`; browser permissions, secure-context rules, and user activation apply.
   *
   * @param text - Text to place on the system clipboard.
   * @returns A Promise resolving after the browser accepts the write.
   * @throws Rejects when the API is absent, permission is denied, or the browser write fails.
   * @example await BrowserUtilities.copyToClipboard('Copied text');
   */
  copyToClipboard,
  /**
   * Checks the user-agent string for `Mobi` or `Android`, ignoring case.
   * This is a heuristic, not viewport, touch, capability, or reliable device detection.
   *
   * @returns Whether the browser user-agent matches the heuristic.
   * @throws {ReferenceError} Outside environments providing `navigator`.
   * @example BrowserUtilities.isMobile(); // Depends on navigator.userAgent.
   */
  isMobile,
  /**
   * Best-effort private browsing heuristic.
   *
   * Behavior remains a bounded best-effort compatibility heuristic in v1.2.
   * @deprecated Browser privacy modes are intentionally not reliably detectable and
   * there is no reliable replacement. Remove dependent security/authorization logic;
   * analytics uses must tolerate false positives, false negatives, and browser changes.
   *
   * @param options - Timeout in milliseconds: default 1,000; finite values clamped to 0–5,000.
   * @returns A Promise of a best-effort guess. Timeout, unsupported environments, or probe failures
   *   normally resolve with `isPrivate: false`; the result never establishes a privacy guarantee.
   * @remarks May briefly create/delete an IndexedDB database or request storage quota information.
   * @example const result = await BrowserUtilities.detectIncognito({ timeoutMs: 500 });
   */
  detectIncognito,
};
