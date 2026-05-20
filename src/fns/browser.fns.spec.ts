// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { BrowserUtilities } from './browser.fns';

// ─── helpers ─────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── helper: stub navigator.userAgent in jsdom ───────────────────────────────

// jsdom's navigator.userAgent lives on the prototype as a configurable getter,
// but vi.stubGlobal cannot override it because jsdom locks the window.navigator
// property itself. The reliable approach is to shadow it directly on the
// navigator instance — jsdom allows that — and clean up with `delete` afterwards.

function stubUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
    writable: false,
  });
}

function restoreUserAgent() {
  // Delete the own property so the prototype getter takes over again.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (navigator as any).userAgent;
}

// ─── isMobile ────────────────────────────────────────────────────────────────

describe('BrowserUtilities.isMobile', () => {
  afterEach(() => {
    restoreUserAgent();
  });

  it('returns true for an iPhone user-agent (contains "Mobile")', () => {
    // Real iOS Safari UA includes "Mobile" which matches the /Mobi/ branch of the regex.
    stubUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns true for an Android user-agent', () => {
    stubUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36');
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns true for a generic "Mobi" user-agent', () => {
    stubUserAgent('SomeBrowser/1.0 Mobi/Safari');
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns false for a standard desktop Chrome user-agent', () => {
    stubUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );
    expect(BrowserUtilities.isMobile()).toBe(false);
  });

  it('returns false for a macOS Safari user-agent', () => {
    stubUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15'
    );
    expect(BrowserUtilities.isMobile()).toBe(false);
  });
});

// ─── detectIncognito ─────────────────────────────────────────────────────────

describe('BrowserUtilities.detectIncognito', () => {
  it('is a function exposed on BrowserUtilities', () => {
    expect(typeof BrowserUtilities.detectIncognito).toBe('function');
  });

  it('returns a Promise', () => {
    // detectIncognito uses browser-specific APIs that may reject in jsdom;
    // we only verify the return type without awaiting the resolution.
    const result = BrowserUtilities.detectIncognito();
    expect(result).toBeInstanceOf(Promise);
    // Prevent unhandled rejection from propagating in test output
    result.catch(() => {/* intentionally ignored */});
  });
});

// ─── copyToClipboard ─────────────────────────────────────────────────────────

describe('BrowserUtilities.copyToClipboard', () => {
  it('calls navigator.clipboard.writeText with the given text', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    BrowserUtilities.copyToClipboard('hello world');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('hello world');
  });

  it('calls writeText with an empty string', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    BrowserUtilities.copyToClipboard('');

    expect(writeText).toHaveBeenCalledWith('');
  });
});

// ─── download (smoke tests) ──────────────────────────────────────────────────

describe('BrowserUtilities.download', () => {
  it('does not throw when called with null', () => {
    expect(() => BrowserUtilities.download(null)).not.toThrow();
  });

  it('does not throw when called with undefined', () => {
    expect(() => BrowserUtilities.download(undefined)).not.toThrow();
  });

  it('creates and clicks an <a> element when given a URL string', () => {
    // Spy on document.createElement to intercept the <a> tag the function creates
    const mockClick = vi.fn();
    const mockA = {
      href: '',
      download: '',
      target: '',
      style: { visibility: '' },
      click: mockClick,
      remove: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockA as unknown as HTMLElement);

    // appendchild / removeChild should not throw
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA as unknown as Node);

    BrowserUtilities.download('/api/export?format=csv', 'data.csv');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('sets target="_blank" for http:// URLs', () => {
    const mockA = {
      href: '',
      download: '',
      target: '',
      style: { visibility: '' },
      click: vi.fn(),
      remove: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockA as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA as unknown as Node);

    BrowserUtilities.download('https://example.com/report.pdf');

    expect(mockA.target).toBe('_blank');
  });
});
