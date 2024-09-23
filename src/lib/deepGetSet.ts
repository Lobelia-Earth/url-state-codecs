import type { PartialDeep } from 'type-fest';
import type { SimpleKey } from './types';

type UnknownRecord = Record<SimpleKey, unknown>;
type UnknownArray = unknown[];

/**
 * For any deeply indexable type `T`, extract the type at `Path`.
 * Similar to type-fest's `Get` but without the complexity of
 * period-delimited string paths or the limitation of string-only
 * indexing.
 */
export type GetNestedType<T, Path extends SimpleKey[]> = Path extends [
  infer Head extends keyof T,
  ...infer Tail extends SimpleKey[],
]
  ? GetNestedType<T[Head], Tail>
  : Path extends []
    ? T
    : never;

/**
 * Infer the type of a nested data structure based on the `Path` to set
 * `Value` deeply.
 */
export type SetNestedType<Path extends SimpleKey[], Value> = Path extends []
  ? Value
  : Path extends [
        infer Head extends SimpleKey,
        ...infer Tail extends SimpleKey[],
      ]
    ? Head extends number
      ? Array<SetNestedType<Tail, Value>>
      : Head extends string
        ? Record<Head, SetNestedType<Tail, Value>>
        : unknown
    : unknown;

type IndexableUnknown = UnknownRecord | UnknownArray;

/**
 * Gets a nested value from an object or array using a path defined by
 * an array of keys. Although this does support accessing array elements
 * by index number, the index must be stringified. E.g.:
 *
 * ```ts
 * const tree = {
 *   limbs: [
 *      { branches: [ { leafCount: 5 } ] },
 *      { branches: [ { leafCount: 8 } ] }
 *   ]
 * } as const;
 *
 * // The return type and value of this function call are both 8.
 * get(tree, 'limbs', 1, 'branches', 0, 'leafCount');
 * ```
 */
export const getDeep = <T, Path extends SimpleKey[]>(
  indexable: T,
  ...path: Path
): GetNestedType<T, Path> => {
  // A type-safe FP approach would be to use recursion. Instead, we
  // reassign a placeholder `value` imperatively with type assertions
  // over a `for` loop because we need `get()` to be _fast_ and TCO does
  // not exist in most engines.
  let value = indexable as IndexableUnknown;
  for (const key of path) {
    if (typeof value !== 'object' || value === null) {
      return undefined as GetNestedType<T, Path>;
    }
    if (Array.isArray(value)) {
      value = value[Number(key)] as IndexableUnknown;
      continue;
    } else if (key in value) {
      value = value[key] as IndexableUnknown;
      continue;
    }

    return undefined as GetNestedType<T, Path>;
  }

  return value as GetNestedType<T, Path>;
};

/**
 * Like `getDeep()` but for _setting_ a value within a nested data
 * structure, scaffolding that structure if it is not yet defined.
 *
 * **Note:** This is done mutably. These mutations should be safe in an
 * immutable context provided that only the codecs - which neither
 * modify the objects they've been passed nor mutate them once they've
 * been returned - use this.
 */
export const setDeep = <
  PathHead extends SimpleKey,
  PathTail extends SimpleKey[],
  Value,
  Base extends PartialDeep<SetNestedType<[PathHead, ...PathTail], Value>>,
>(
  target: Base,
  /** Must have at least one element, thus the head and tail. */
  path: [PathHead, ...PathTail],
  value: Value
): void => {
  let nestedTarget = target as Record<string | number, unknown>;
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i];
    if (i === path.length - 1) {
      // Leaf
      nestedTarget[key] = value;
    } else {
      // Branch
      nestedTarget[key] ??= typeof key === 'number' ? [] : {};
      nestedTarget = nestedTarget[key] as Record<string | number, unknown>;
    }
  }
};
