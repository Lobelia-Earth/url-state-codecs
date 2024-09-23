import { ValueCodec } from '../../lib/types';
import { ok } from '../../lib/result';

export const encodedNaNValue = 'NaN';

/**
 * Wraps a `ValueCodec<number>` with additional logic for encoding and
 * decoding `NaN` values. Use this with `numberCodec` if you want it to
 * encode and decode `NaN` as a valid value instead of failing with an
 * error result.
 */
const withNaN = (codec: ValueCodec<number>): ValueCodec<number> => ({
  encode: (value, defaultValue) => {
    if (isNaN(value)) {
      return typeof defaultValue === 'number' && isNaN(defaultValue)
        ? ok(undefined)
        : ok(encodedNaNValue);
    }
    return codec.encode(value, defaultValue);
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    if (encodedValue === encodedNaNValue) {
      return ok(NaN);
    }
    return codec.decode(encodedValue, defaultValue);
  },
});

export default withNaN;
