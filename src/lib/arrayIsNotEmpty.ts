/**
 * Create a new tuple type requiring at least one element of type `T`.
 *
 * We might have been able to use type-fest's `NonEmptyTuple`, but that
 * alias is for a `readonly` array, which, though strictly type-safe,
 * creates problems elsewhere.
 */
type NonEmptyArray<T> = [T, ...T[]];

/**
 * The JavaScript logic is trivial, but this type predicate function is
 * handy in ensuring that arrays have at least one element in cases
 * where non-empty arrays are expected.
 *
 * Using this may result in some awkward double-negatives, such as:
 *
 * ```ts
 * if (!arrayIsNotEmpty(array)) {
 *   // ...
 * }
 * ```
 *
 * However, TypeScript is not able to make the inference from a
 * contrapositive type predicate function and `if` statement:
 *
 * ```ts
 * if (arrayIsEmpty(array)) {
 *   throw Error('array is empty')
 * }
 *
 * // array is still just an array
 * ```
 */
const arrayIsNotEmpty = <T>(array: T[]): array is NonEmptyArray<T> =>
  Boolean(array.length);

export default arrayIsNotEmpty;
