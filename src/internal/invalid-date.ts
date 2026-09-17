import { UnsupportedSerializationTypeError } from '../errors';

/**
 * Rejects a `Date` holding `NaN` anywhere inside a JSON-domain value.
 *
 * `stableStringify` encodes such a `Date` as `"Invalid Date"` so that one unparsable cell
 * cannot abort an otherwise supported value. Callers that must stay fail-closed run this
 * first and keep the pre-1.2.1 rejection. The AES-GCM token API is the only such caller
 * today: its plaintext is read back with `JSON.parse`, so an encoded invalid `Date` would
 * decrypt as the string `"Invalid Date"` instead of failing.
 *
 * Only invalid dates are inspected here. Safe keys, accessors, depth, cycles, and every
 * unsupported type stay the responsibility of the serializer that runs next, so this
 * guard never has to mirror those rules.
 */
export const assertNoInvalidDate = (value: unknown, path = '$', seen = new WeakSet<object>()): void => {
  if (value === null || typeof value !== 'object') return;

  const objectValue = value as object;
  // A repeated reference cannot hide a new invalid date, and a true cycle is rejected by
  // the serializer itself, so revisiting is never required.
  if (seen.has(objectValue)) return;
  seen.add(objectValue);

  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new UnsupportedSerializationTypeError('Invalid Date', path);
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      // Accessors are never invoked; the serializer rejects them on its own pass.
      if (descriptor && 'value' in descriptor) {
        assertNoInvalidDate(descriptor.value, `${path}[${index}]`, seen);
      }
    }
    return;
  }

  const prototype = Object.getPrototypeOf(objectValue);
  // Anything that is not a plain record is rejected by the serializer, so it is not walked.
  if (prototype !== Object.prototype && prototype !== null) return;

  for (const key of Object.keys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor && 'value' in descriptor) {
      assertNoInvalidDate(descriptor.value, `${path}.${key}`, seen);
    }
  }
};
