import { ValueCodec } from '../../lib/types';
import { ok } from '../../lib/result';

export const encodedNullValue = 'null';

/**
 * Wraps any `ValueCodec` with handlers for cases where values are
 * nullable. All codecs should know how to handle `undefined`, but this
 * additionally encodes `null` as `"null"` and decodes vice versa.
 */
const nullable = <T>(codec: ValueCodec<T>): ValueCodec<T | null> => ({
  encode: (value, defaultValue) => {
    if (value === null) {
      if (defaultValue === null) {
        return ok(undefined);
      } else {
        return ok(encodedNullValue);
      }
    }
    return (codec as ValueCodec<T | null>).encode(value, defaultValue);
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === encodedNullValue) {
      if (defaultValue === null) {
        return ok(undefined);
      } else {
        return ok(null);
      }
    }
    return (codec as ValueCodec<T | null>).decode(encodedValue, defaultValue);
  },
});

export default nullable;
