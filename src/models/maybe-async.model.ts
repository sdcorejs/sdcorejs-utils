import { firstValueFrom, from, Observable, of } from 'rxjs';

/**
 * Accepts a plain value, a `Promise`, or an RxJS `Observable` — useful for APIs that
 * need to support all three styles without forcing callers to wrap their values.
 *
 * Use `resolveMaybeAsync` to normalise to a `Promise`, or `normalizeAsync` for an `Observable`.
 *
 * @template T - The resolved value type.
 *
 * @example
 * function loadUser(source: MaybeAsync<User>): Promise<User> {
 *   return resolveMaybeAsync(source);
 * }
 *
 * loadUser({ id: 1, name: 'Alice' });           // plain value
 * loadUser(fetch('/api/user').then(r => r.json())); // Promise
 * loadUser(userService.getUser(1));              // Observable
 */
export type MaybeAsync<T> = T | Promise<T> | Observable<T>;

/**
 * Resolves a `MaybeAsync<T>` to a `Promise<T>`.
 *
 * - Plain value → `Promise.resolve(value)`
 * - `Promise` → returned as-is
 * - `Observable` → converted via `firstValueFrom` (takes the first emission, then completes)
 *
 * @template T - The resolved value type.
 * @param value - A plain value, `Promise<T>`, or `Observable<T>`.
 * @returns A `Promise` that resolves to `T`.
 *
 * @example
 * const user = await resolveMaybeAsync(userService.getUser(42)); // Observable<User> → Promise<User>
 * const name = await resolveMaybeAsync('Alice');                 // 'Alice'
 */
export const resolveMaybeAsync = <T>(value: MaybeAsync<T>): Promise<T> => {
  if (value instanceof Promise) return value;
  if (isObservable(value)) return firstValueFrom(value);
  return Promise.resolve(value);
};

/**
 * Normalises a `MaybeAsync<T>` to an `Observable<T>`.
 *
 * - Plain value → `of(value)` (single-emission observable)
 * - `Promise` → converted via `from`
 * - `Observable` → returned as-is
 *
 * @template T - The resolved value type.
 * @param value - A plain value, `Promise<T>`, or `Observable<T>`.
 * @returns An `Observable` that emits `T`.
 *
 * @example
 * normalizeAsync(42).subscribe(v => console.log(v));                     // logs 42
 * normalizeAsync(Promise.resolve('hi')).subscribe(v => console.log(v));  // logs 'hi'
 * normalizeAsync(of('world')).subscribe(v => console.log(v));            // logs 'world'
 */
export const normalizeAsync = <T>(value: MaybeAsync<T>): Observable<T> => {
  if (isObservable(value)) return value;
  if (value instanceof Promise) return from(value);
  return of(value);
};

function isObservable(obj: any): obj is Observable<any> {
  return obj && typeof obj.subscribe === 'function';
}
