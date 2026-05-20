/**
 * Union of all "leaf-primitive" types — recursion stops when a property value matches one of these.
 */
type Primitive = string | number | boolean | null | undefined | Date | Function;

/**
 * Recursively builds a union of dot-notation key paths for all properties of `ObjectType`,
 * up to a maximum depth of 4 to prevent infinite recursion on circular types.
 *
 * Arrays and Primitives are treated as leaves — their keys are included but not descended into.
 * Nested objects produce both the parent key and every reachable child path separated by `.`.
 *
 * @template ObjectType - The object type to extract key paths from.
 * @template Depth - Internal depth counter; do not supply manually.
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   address: {
 *     city: string;
 *     country: string;
 *   };
 *   roles: string[];
 * }
 *
 * type UserKeys = NestedKeyOf<User>;
 * // 'id' | 'name' | 'address' | 'address.city' | 'address.country' | 'roles'
 *
 * const sortField: NestedKeyOf<User> = 'address.city'; // valid
 * const badField: NestedKeyOf<User> = 'address.zip';   // TS error
 */
export type NestedKeyOf<ObjectType, Depth extends number[] = []> = Depth['length'] extends 4
  ? never
  : ObjectType extends object
    ? {
        [Key in keyof ObjectType & string]: ObjectType[Key] extends Primitive
          ? Key
          : ObjectType[Key] extends Array<any>
            ? Key
            : ObjectType[Key] extends object
              ? Key | `${Key}.${NestedKeyOf<ObjectType[Key], [...Depth, 1]>}`
              : Key;
      }[keyof ObjectType & string]
    : string;
