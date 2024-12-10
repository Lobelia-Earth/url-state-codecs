/**
 * Deeply compares two values. For primitives, strict equality is used.
 * For objects and arrays, their values are recursively traversed by
 * key. Given that the context here is JSON serialization and
 * deserialization, anything else such as a function is ignored, for
 * which it returns `true`.
 *
 * For example...
 *
 * ```ts
 * deepEquals(
 *   { a: 1, b: () => 2 },
 *   { a: 1, b: () => null }
 * );
 * ```
 *
 * ...returns `true` because the `a` property is the same across both
 * objects and the `b` method is ignored. However...
 *
 * ```ts
 * deepEquals(
 *   { a: () => 1, b: 2 },
 *   { a: () => 1, b: null }
 * );
 * ```
 *
 * ...returns `false` because the `b` property differs.
 *
 * **Note:** In theory, the generic type `T` could be written with
 * type-fest as `T extends Jsonifiable` to enforce the JSON
 * serialization context. However, this has lead to some inexplicable
 * type errors.
 */
const deepEquals = <T>(a: T, b: T): boolean => {
  // Null comparison
  if (a === null || b === null) {
    return a === b;
  }

  // Primitive comparison
  if (
    typeof a === 'bigint' ||
    typeof a === 'boolean' ||
    typeof a === 'number' ||
    typeof a === 'undefined'
  ) {
    return a === b;
  }

  // Non-null object comparison
  if (typeof a === 'object') {
    if (typeof b !== 'object') {
      return false;
    }

    // Array comparison
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || b.length !== a.length) {
        return false;
      }
      for (let i = 0; i < a.length; i += 1) {
        if (!deepEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    // Non-array object comparison
    const aKeys = Object.keys(a) as Array<keyof T>;
    const bKeys = Object.keys(b) as Array<keyof T>;
    const allKeys = new Set(
      // Ignore symbols
      [...aKeys, ...bKeys].filter((key) => typeof key === 'string')
    );
    for (const key of allKeys) {
      if (!deepEquals(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  // Ignore differences between any other types of values
  return true;
};

export default deepEquals;
