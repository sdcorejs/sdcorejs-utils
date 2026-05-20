import { firstValueFrom, from, Observable, of } from 'rxjs';

export type MaybeAsync<T> = T | Promise<T> | Observable<T>;

export const resolveMaybeAsync = <T>(value: MaybeAsync<T>): Promise<T> => {
  if (value instanceof Promise) {
    return value;
  }
  if (isObservable(value)) {
    return firstValueFrom(value);
  }
  return Promise.resolve(value);
};

export const normalizeAsync = <T>(value: MaybeAsync<T>): Observable<T> => {
  if (isObservable(value)) {
    return value;
  }
  if (value instanceof Promise) {
    return from(value);
  }
  return of(value);
};

function isObservable(obj: any): obj is Observable<any> {
  return obj && typeof obj.subscribe === 'function';
}
