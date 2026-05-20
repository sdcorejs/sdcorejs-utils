import { firstValueFrom, from, Observable, of } from 'rxjs';

export type SdMaybeAsync<T> = T | Promise<T> | Observable<T>;

export const SdResolveMaybeAsync = <T>(value: SdMaybeAsync<T>): Promise<T> => {
  if (value instanceof Promise) {
    return value;
  }
  if (isObservable(value)) {
    return firstValueFrom(value);
  }
  return Promise.resolve(value);
};

export const SdNormalizeAsync = <T>(value: SdMaybeAsync<T>): Observable<T> => {
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
