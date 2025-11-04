import { ValueCodec } from '../lib/types';
import { error, ok, Result } from '../lib/result';
import stringCodec from './stringCodec';
import numberCodec from './numberCodec';

export type SupportedLiteralType = string | number;

const decodersByType = {
  string: stringCodec.decode,
  number: numberCodec.decode,
};

/**
 * Encodes a union of literal values as a URI component and back again.
 *
 * **Note:** If `literalValues` contains both a number and its string
 * form, precedence will be based on their order when decoding. For
 * example, if `1, '1'` are passed in as the definition of the union and
 * `decode()` is called with `'1'`, the result will be the number `1`
 * because it was the first matching member of the union.
 *
 * @see stringCodec
 * @see numberCodec
 */
const unionOfLiterals = <T extends SupportedLiteralType>(
  literalValues: Array<T>
): ValueCodec<T> => {
  for (const literalValue of literalValues) {
    if (!((typeof literalValue) in decodersByType)) {
      throw new Error(
        `Cannot create a codec for a union of literals containing a member of type ${typeof literalValue}`
      );
    }
  }
  return {
    encode: (value, defaultValue) => {
      if (value === defaultValue) {
        return ok(undefined);
      }
      if (!literalValues.includes(value)) {
        return error(
          new Error(
            `Cannot encode ${value} because it is not a member of the union of expected values`
          )
        );
      }
      if (typeof value === 'string') {
        return stringCodec.encode(value);
      }
      if (typeof value === 'number') {
        return numberCodec.encode(value);
      }
      return error(
        new Error(
          `Values of type ${typeof value} cannot be encoded as a member of a union of literals`
        )
      );
    },
    decode: (encodedValue, defaultValue) => {
      if (encodedValue === undefined) {
        return ok(defaultValue);
      }

      const decodeResultsByType = {
        string: decodersByType.string(encodedValue),
        number: decodersByType.number(encodedValue),
      } as const satisfies Record<keyof typeof decodersByType, Result<unknown>>;

      const errors: Error[] = [];

      for (const literalValue of literalValues) {
        // Runtime type checking was already done above in the outer
        // factory function.
        const literalValueType =
          typeof literalValue as keyof typeof decodersByType;
        const decodeResult = decodeResultsByType[literalValueType];
        if (!decodeResult.ok) {
          errors.push(
            new Error(
              `Encoded value "${encodedValue}" does not match the literal ${literalValueType} ${literalValue} union member because it could not be decoded as such`,
              { cause: decodeResult.error }
            )
          );
          continue;
        }
        if (decodeResult.data !== literalValue) {
          errors.push(
            new Error(
              `Encoded value "${encodedValue}" does not match the literal ${literalValueType} ${literalValue} union member because its decoded value, ${decodeResult.data}, differs`
            )
          );
          continue;
        }
        return ok(literalValue);
      }

      return error(
        new Error(
          `Unable to match encoded value ${encodedValue} to a member of its expected union`,
          { cause: errors }
        )
      );
    },
  };
};

export default unionOfLiterals;
