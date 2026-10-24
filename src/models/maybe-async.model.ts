import { EmptySubscribableError, ValidationError } from '../errors';

/** Minimal subscription cleanup contract compatible with common observable libraries. */
export interface SubscriptionLike {
  /** Whether the subscription has been closed, when exposed by the implementation. */
  readonly closed?: boolean;
  /**
   * Stops future emissions and releases subscription resources.
   *
   * @returns Nothing; cleanup idempotence and thrown failures depend on the source implementation.
   * @example
   * const subscription = normalizeSubscribable(1).subscribe();
   * if (typeof subscription === 'object') subscription.unsubscribe();
   */
  unsubscribe(): void;
}

/**
 * Observer callbacks accepted by structural subscribables.
 *
 * @typeParam T - Type delivered to next; terminal callbacks do not receive a value of T.
 */
export interface ObserverLike<T> {
  /**
   * Receives a value.
   *
   * @param value - Emitted value, passed by reference without cloning.
   * @returns Nothing; callback exceptions follow the source's error-delivery contract.
   * @example const observer: ObserverLike<number> = { next: value => { console.log(value); } };
   */
  next?(value: T): void;
  /**
   * Receives a terminal source error.
   *
   * @param error - Terminal source failure; may be any JavaScript value, not just Error.
   * @returns Nothing; callers should handle errors without throwing from this callback.
   * @example const observer: ObserverLike<number> = { error: error => { console.error(error); } };
   */
  error?(error: unknown): void;
  /**
   * Receives successful completion.
   *
   * @returns Nothing; signifies completion with no further values expected from a conforming source.
   * @example const observer: ObserverLike<number> = { complete: () => { console.log('done'); } };
   */
  complete?(): void;
}

/**
 * Cleanup accepted from a structural subscribe call: a SubscriptionLike object with unsubscribe,
 * a zero-argument cleanup function, or undefined/void when no cleanup is needed. Null and other
 * shapes are invalid for resolveMaybeAsync. Cleanup exceptions reject its pending result.
 *
 * @example const teardown: SubscriptionTeardownLike = () => {}; // Put source cleanup in the callback.
 */
export type SubscriptionTeardownLike = SubscriptionLike | (() => void) | void;

/**
 * Dependency-free structural observable contract. RxJS Observables and other
 * libraries with compatible `subscribe` overloads can be supplied without adding
 * RxJS to this package's runtime or declarations.
 *
 * The first parameter deliberately excludes `null`. RxJS's single-argument
 * `subscribe(observerOrNext?)` overload does not accept `null`, and a `null` here
 * made an Observable of a narrower type (`Observable<string>` for
 * `string | null | undefined`, an Observable of a subtype or of one union member)
 * unassignable to this contract, which broke `MaybeAsync` slots that accepted it
 * under 1.1.x. Implementations may still accept `null`.
 *
 * @typeParam T - Emitted value type; this interface does not include RxJS-specific operators.
 */
export interface SubscribableLike<T> {
  /**
   * Registers an observer or individual callbacks with the source.
   *
   * @param observerOrNext - Optional observer object or next callback; emissions may occur synchronously.
   * @param error - Error callback when using the callback form.
   * @param complete - Completion callback when using the callback form.
   * @returns A subscription, cleanup function, or undefined, depending on the source.
   * @throws Source implementations may throw during subscription or callback delivery.
   * @example const cleanup = normalizeSubscribable(1).subscribe(value => { console.log(value); });
   */
  subscribe(
    observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void),
    error?: (error: unknown) => void,
    complete?: () => void,
  ): SubscriptionTeardownLike;
}

/**
 * A plain value, any `PromiseLike`, or a structurally compatible subscribable.
 *
 * @typeParam T - Resolved/emitted value type. Subscribables may emit more than once, but
 *   resolveMaybeAsync takes only the first notification that settles the result.
 * @example const input: MaybeAsync<number> = Promise.resolve(1);
 */
export type MaybeAsync<T> = T | PromiseLike<T> | SubscribableLike<T>;

/**
 * Returns whether a value exposes a callable Promise/A+ `then` method.
 *
 * @typeParam T - Expected fulfillment type; this structural test does not validate emitted values.
 * @param value - Any object/function candidate; null and primitives return false.
 * @returns Whether reading then yields a function. This does not verify complete Promise/A+ behavior.
 * @throws Propagates getter/Proxy failures when reading then.
 * @example isPromiseLike(Promise.resolve(1)); // true
 */
export const isPromiseLike = <T = unknown>(value: unknown): value is PromiseLike<T> =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/**
 * Returns whether a value exposes a callable structural `subscribe` method.
 *
 * @typeParam T - Expected emitted type; this test does not validate notifications or cleanup.
 * @param value - Any object/function candidate; null and primitives return false.
 * @returns Whether reading subscribe yields a function.
 * @throws Propagates getter/Proxy failures when reading subscribe.
 * @example isSubscribableLike(normalizeSubscribable(1)); // true
 */
export const isSubscribableLike = <T = unknown>(value: unknown): value is SubscribableLike<T> =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  typeof (value as { subscribe?: unknown }).subscribe === 'function';

const normalizeTeardown = (teardown: SubscriptionTeardownLike): (() => void) | undefined => {
  if (teardown === undefined) return undefined;
  if (typeof teardown === 'function') return teardown;
  if (typeof teardown !== 'object' || teardown === null) {
    throw new ValidationError('subscribe() returned an invalid cleanup value');
  }
  const unsubscribe = (teardown as { unsubscribe?: unknown }).unsubscribe;
  if (typeof unsubscribe !== 'function') {
    throw new ValidationError('subscribe() returned an invalid cleanup value');
  }
  return () => { unsubscribe.call(teardown); };
};

type SubscribableNotification<T> =
  | { type: 'next'; value: T }
  | { type: 'error'; error: unknown }
  | { type: 'complete' };

const resolveSubscribable = <T>(source: SubscribableLike<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let state: 'subscribing' | 'active' | 'settled' = 'subscribing';
    let pendingNotification: SubscribableNotification<T> | undefined;
    let cleanupCallback: (() => void) | undefined;
    let cleanupRun = false;

    const cleanup = (): void => {
      if (cleanupRun || cleanupCallback === undefined) return;
      cleanupRun = true;
      cleanupCallback();
    };
    const settle = (notification: SubscribableNotification<T>): void => {
      if (state === 'settled') return;
      state = 'settled';
      try {
        cleanup();
      } catch (cleanupError) {
        reject(cleanupError);
        return;
      }
      if (notification.type === 'next') resolve(notification.value);
      else if (notification.type === 'error') reject(notification.error);
      else reject(new EmptySubscribableError());
    };
    const notify = (notification: SubscribableNotification<T>): void => {
      if (state === 'settled' || pendingNotification !== undefined) return;
      if (state === 'subscribing') {
        pendingNotification = notification;
        return;
      }
      settle(notification);
    };

    try {
      const teardown = source.subscribe({
        next: value => notify({ type: 'next', value }),
        error: error => notify({ type: 'error', error }),
        complete: () => notify({ type: 'complete' }),
      });
      cleanupCallback = normalizeTeardown(teardown);
      state = 'active';
      if (pendingNotification !== undefined) settle(pendingNotification);
    } catch (error) {
      state = 'settled';
      pendingNotification = undefined;
      reject(error);
    }
  });

/**
 * Resolves the first value from a plain value, `PromiseLike`, or subscribable.
 * Promise-like detection is realm-independent. Subscribables are unsubscribed after
 * their first value, errors reject, and empty completion rejects with
 * {@link EmptySubscribableError}.
 *
 * @typeParam T - Result type, delivered without cloning or schema validation.
 * @param value - Plain value, thenable, or subscribable; thenables take precedence if both methods exist.
 * @returns A Promise of the plain/fulfilled/first emitted value. Synchronous subscribable notifications
 *   wait until subscribe returns so cleanup can run once. There is no timeout/cancellation option;
 *   a source that never emits, errors, or completes can leave the Promise pending indefinitely.
 * @throws {EmptySubscribableError} Rejects if a subscribable completes without a value.
 * @throws {ValidationError} Rejects invalid teardown values.
 * @throws Rejects source, getter, subscription, and cleanup failures; a cleanup failure wins over a pending value.
 * @example await resolveMaybeAsync(Promise.resolve(42)); // 42
 */
export const resolveMaybeAsync = <T>(value: MaybeAsync<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (isPromiseLike<T>(value)) {
      void Promise.resolve(value).then(resolve, reject);
      return;
    }
    if (isSubscribableLike<T>(value)) {
      void resolveSubscribable(value).then(resolve, reject);
      return;
    }
    resolve(value as T);
  });

const toObserver = <T>(
  observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void) | null,
  error?: (error: unknown) => void,
  complete?: () => void,
): Partial<ObserverLike<T>> =>
  typeof observerOrNext === 'function'
    ? { next: observerOrNext, error, complete }
    : (observerOrNext ?? {});

const reportObserverError = (error: unknown): void => {
  const reporter = (globalThis as typeof globalThis & { reportError?: (reason: unknown) => void }).reportError;
  if (typeof reporter === 'function') {
    reporter(error);
    return;
  }
  queueMicrotask(() => { throw error; });
};

const invokePromiseObserver = (callback: () => void): void => {
  try {
    callback();
  } catch (error) {
    // Match observable host-reporting semantics without creating a detached,
    // unhandled rejected Promise or silently discarding consumer callback errors.
    reportObserverError(error);
  }
};

const createSubscribable = <T>(value: T | PromiseLike<T>): SubscribableLike<T> => ({
  subscribe(
    observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void) | null,
    error?: (error: unknown) => void,
    complete?: () => void,
  ): SubscriptionLike {
    const observer = toObserver(observerOrNext, error, complete);
    let closed = false;
    const subscription: SubscriptionLike = {
      get closed() { return closed; },
      unsubscribe: () => { closed = true; },
    };
    const emit = (resolved: T): void => {
      if (closed) return;
      try {
        observer.next?.(resolved);
        if (!closed) observer.complete?.();
      } finally {
        closed = true;
      }
    };
    const fail = (reason: unknown): void => {
      if (closed) return;
      closed = true;
      if (observer.error) observer.error(reason);
      else reportObserverError(reason);
    };

    if (isPromiseLike<T>(value)) {
      void Promise.resolve(value).then(
        resolved => { invokePromiseObserver(() => emit(resolved)); },
        reason => { invokePromiseObserver(() => fail(reason)); },
      );
    }
    else emit(value);
    return subscription;
  },
});

/**
 * Returns an existing subscribable unchanged, preserving its concrete type, or wraps
 * a value/Promise-like in the dependency-free structural subscribable contract.
 *
 * @typeParam TSource - Concrete subscribable type returned unchanged, including its additional methods.
 * @param value - Plain value, thenable, or existing subscribable. Existing subscribables are returned unchanged.
 * @returns The original subscribable, or a minimal wrapper that emits one value then completes.
 *   Plain values emit synchronously; thenables settle asynchronously. Unsubscribe suppresses
 *   wrapper notifications but cannot cancel the underlying Promise. No RxJS operators are added.
 * @throws Propagates method-access errors during detection. Synchronous observer exceptions propagate;
 *   asynchronous observer exceptions are reported through reportError or a queued throw.
 * @example
 * const source = normalizeSubscribable(42);
 * normalizeSubscribable(source) === source; // true
 */
export function normalizeSubscribable<
  TSource extends { subscribe: (...args: never[]) => unknown },
>(value: TSource): TSource;
/**
 * Normalizes a value to the dependency-free subscribable contract without adding operators.
 *
 * @typeParam T - Value or subscribable type preserved by the matching overload.
 * @param value - Plain value, thenable, or existing subscribable. Existing subscribables are returned unchanged.
 * @returns The original subscribable, or a minimal wrapper that emits one value then completes.
 *   Plain values emit synchronously; thenables settle asynchronously. Unsubscribe suppresses
 *   wrapper notifications but cannot cancel the underlying Promise. No RxJS operators are added.
 * @throws Propagates method-access errors during detection. Synchronous observer exceptions propagate;
 *   asynchronous observer exceptions are reported through reportError or a queued throw.
 * @example normalizeSubscribable(42).subscribe(value => { console.log(value); }); // Logs 42 synchronously.
 */
export function normalizeSubscribable<T>(value: T | PromiseLike<T>): SubscribableLike<T>;
/**
 * Normalizes a value to the dependency-free subscribable contract without adding operators.
 *
 * @typeParam T - Value or subscribable type preserved by the matching overload.
 * @param value - Plain value, thenable, or existing subscribable. Existing subscribables are returned unchanged.
 * @returns The original subscribable, or a minimal wrapper that emits one value then completes.
 *   Plain values emit synchronously; thenables settle asynchronously. Unsubscribe suppresses
 *   wrapper notifications but cannot cancel the underlying Promise. No RxJS operators are added.
 * @throws Propagates method-access errors during detection. Synchronous observer exceptions propagate;
 *   asynchronous observer exceptions are reported through reportError or a queued throw.
 * @example normalizeSubscribable(42).subscribe(value => { console.log(value); }); // Logs 42 synchronously.
 */
export function normalizeSubscribable<T>(value: MaybeAsync<T>): SubscribableLike<T>;
/**
 * Normalizes a value to the dependency-free subscribable contract without adding operators.
 *
 * @param value - Plain value, thenable, or existing subscribable. Existing subscribables are returned unchanged.
 * @returns The original subscribable, or a minimal wrapper that emits one value then completes.
 *   Plain values emit synchronously; thenables settle asynchronously. Unsubscribe suppresses
 *   wrapper notifications but cannot cancel the underlying Promise. No RxJS operators are added.
 * @throws Propagates method-access errors during detection. Synchronous observer exceptions propagate;
 *   asynchronous observer exceptions are reported through reportError or a queued throw.
 * @example normalizeSubscribable(42).subscribe(value => { console.log(value); }); // Logs 42 synchronously.
 */
export function normalizeSubscribable(value: unknown): unknown {
  if (isSubscribableLike(value)) return value;
  return createSubscribable(value);
}

/**
 * Compatibility alias for {@link normalizeSubscribable}. In v1.2.0 the returned
 * contract is structural rather than an RxJS `Observable`; `.subscribe(...)`
 * remains available. An input RxJS Observable is returned unchanged with its
 * concrete type, so existing Observable-only methods remain typed for that case.
 *
 * @deprecated Prefer {@link normalizeSubscribable} to make the dependency-free
 * return contract explicit. Consumers that call RxJS-only methods such as `.pipe()`
 * must normalize with RxJS in their own application; that migration can change the
 * returned type for plain values and promises.
 *
 * @param value - Plain value, PromiseLike, or existing subscribable, as in {@link normalizeSubscribable}.
 * @returns The same minimal wrapper or unchanged subscribable as normalizeSubscribable.
 * @throws Propagates the same detection/notification failures as normalizeSubscribable.
 * @example normalizeAsync(42).subscribe(value => { console.log(value); });
 */
export const normalizeAsync = normalizeSubscribable;
