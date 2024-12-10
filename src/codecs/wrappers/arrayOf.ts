import { IsNumericLiteral, Primitive } from 'type-fest';
import { ValueCodec, TupleOfTypeAndLength } from '../../lib/types';
import { OkResult, error, ok } from '../../lib/result';

/**
 * It's a bit ugly to have to use escape characters, but the meaning of
 * a comma is clear once decoded and it's in common use already.
 */
export type EncodedComma = '%2C';

/**
 * Suitably unambiguous as a separator for both strings and numbers.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3986#section-2.2
 */
export type UniversalArraySeparator = EncodedComma | '~' | '!';
export type StringArraySeparator = UniversalArraySeparator | '.' | '-';
export type NumberArraySeparator = UniversalArraySeparator | 'x' | 'X';

export type SeparatorForPrimitive<T extends Primitive> = T extends number
  ? NumberArraySeparator
  : T extends string
    ? StringArraySeparator
    : UniversalArraySeparator;

/**
 * We could use `deepEquals()`, but value codecs bundle their
 * dependencies separately from the main module. This is simpler and
 * faster given that we know we are comparing arrays of primitives.
 */
const primitiveArraysAreEqual = <T extends Primitive>(
  a: T[],
  b: T[]
): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Wraps a primitive value codec (e.g. `ValueCodec<number>` or
 * `ValueCodec<string>`) so that an array of such primitives can be
 * represented in URL search params with a delimiter.
 *
 * For example:
 *
 * ```ts
 * const center = [42.4027, 2.1563];
 * ```
 *
 * can be represented with this wrapper and the separator `x` as:
 *
 * ```
 * ?center=42.4027x2.1563
 * ```
 */
const arrayOf = <
  T extends Primitive,
  S extends SeparatorForPrimitive<T>,
  L extends number | undefined,
>(
  codec: ValueCodec<T>,
  separator: S,
  expectedTupleLength?: L
): ValueCodec<
  L extends number
    ? IsNumericLiteral<L> extends true
      ? TupleOfTypeAndLength<T, L>
      : T[]
    : T[]
> => ({
  encode: (value, defaultValue) => {
    if (
      Array.isArray(defaultValue) &&
      primitiveArraysAreEqual(value, defaultValue)
    ) {
      return ok(undefined);
    }
    try {
      const escapedSeparator = `%${separator.charCodeAt(0).toString(16)}`;

      const encodeResults = value.map((element) => {
        const encodeResult = codec.encode(element);
        if (!encodeResult.ok) {
          return encodeResult;
        }
        const escapedEncoding = encodeResult.data?.replaceAll(
          separator,
          escapedSeparator
        );
        return ok(escapedEncoding);
      });

      const errorResults = encodeResults.filter((result) => !result.ok);
      if (errorResults.length) {
        return error(
          new Error('Some elements in the array were un-encodable', {
            cause: errorResults,
          })
        );
      }
      const encodedElements = encodeResults.map(
        (result) => (result as OkResult<T>).data
      );
      return ok(encodedElements.join(separator));
    } catch (cause) {
      return error(new Error('Unable to encode array', { cause }));
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    try {
      const encodedElements = encodedValue.split(separator);
      const decodeResults = encodedElements.map((element) =>
        codec.decode(element)
      );
      const errorResults = decodeResults.filter((result) => !result.ok);
      if (errorResults.length) {
        return error(
          new Error(
            `The URL parameter value "${encodedValue}" was decoded as an array, but some of its elements were un-decodable`,
            {
              cause: errorResults,
            }
          )
        );
      }

      const decodedElements = decodeResults.map(
        (result) => (result as OkResult<T>).data
      );

      if (
        typeof expectedTupleLength === 'number' &&
        decodedElements.length !== expectedTupleLength
      ) {
        return error(
          new Error(
            `The URL parameter value "${encodedValue}" was decoded as an array, but the length was wrong. Expected a length of ${expectedTupleLength}. Saw ${decodedElements.length}.`
          )
        );
      }

      return ok(
        decodedElements as L extends number
          ? IsNumericLiteral<L> extends true
            ? TupleOfTypeAndLength<T, L>
            : T[]
          : T[]
      );
    } catch (cause) {
      return error(
        new Error(
          `Unable to decode parameter value "${encodedValue}" as an array`,
          { cause }
        )
      );
    }
  },
});

export default arrayOf;
