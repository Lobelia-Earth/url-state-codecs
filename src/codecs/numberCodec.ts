import { ValueCodec } from '../lib/types';
import { error, ok } from '../lib/result';

/**
 * Encodes a number value. Both the encoder and decoder return error
 * results when NaN is encountered. Use this with the `withNaN` codec
 * wrapper if you need to be able to pass NaN values to and from URL
 * parameters.
 */
const numberCodec: ValueCodec<number> = {
  encode: (value, defaultValue) => {
    if (value === defaultValue) {
      return ok(undefined);
    }
    if (isNaN(value)) {
      return error(
        new Error(
          'Cannot encode NaN. Did you mean to use the withNaN codec wrapper?'
        )
      );
    }
    try {
      return ok(encodeURIComponent(value));
    } catch (cause) {
      return error(new Error(`Unable to encode number ${value}`, { cause }));
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    try {
      const decodedString = decodeURIComponent(encodedValue);
      const decodedValue = Number(decodedString);
      if (isNaN(decodedValue)) {
        return error(
          new Error(
            `Unable to decode "${encodedValue}" as a valid number. If you need to encode and decode NaN values, consider using the withNaN codec wrapper.`
          )
        );
      }
      return ok(decodedValue);
    } catch (cause) {
      return error(
        new Error(`Unable to decode number from "${encodedValue}"`, { cause })
      );
    }
  },
};

export default numberCodec;
