import { isAbortError } from '@sdcorejs/utils/errors';

// example:service:start
export async function loadProfile(
  showToast: (message: string) => void,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    const response = await fetch('/api/profile', { signal });
    if (!response.ok) throw new Error('Profile request failed');
    return await response.json();
  } catch (error: unknown) {
    if (!isAbortError(error, signal)) showToast('Could not load the profile.');
    throw error;
  }
}
// example:service:end

// example:search:start
export function createSearch(
  render: (results: unknown) => void,
  showError: (error: unknown) => void,
) {
  let current: AbortController | undefined;
  return {
    async search(query: string): Promise<void> {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      try {
        const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search request failed');
        const results: unknown = await response.json();
        if (current === controller && !controller.signal.aborted) render(results);
      } catch (error: unknown) {
        if (current !== controller || isAbortError(error, controller.signal)) return;
        showError(error);
      }
    },
    cancel(): void {
      current?.abort();
      current = undefined;
    },
  };
}
// example:search:end

// example:custom-reason:start
export function customCancellation(): boolean {
  const controller = new AbortController();
  const reason = { action: 'navigation' };
  controller.abort(reason);
  try {
    controller.signal.throwIfAborted();
    return false;
  } catch (error: unknown) {
    return isAbortError(error, controller.signal); // true; without the signal: false
  }
}
// example:custom-reason:end

// example:timeout:start
export async function loadWithTimeout(showError: (error: unknown) => void): Promise<void> {
  const signal = AbortSignal.timeout(1_000);
  try {
    const response = await fetch('/api/report', { signal });
    if (!response.ok) throw new Error('Report request failed');
  } catch (error: unknown) {
    if (!isAbortError(error, signal)) showError(error);
  }
}
// example:timeout:end
