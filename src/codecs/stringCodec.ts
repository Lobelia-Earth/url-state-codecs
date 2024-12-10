import type { ValueCodec } from '../lib/types';
import { error, ok } from '../lib/result';

/**
 * Encodes a string as a URI component and back again. Uses
 * `encodeURIComponent()` to escape characters unsafe for use in URL
 * parameter values.
 */
const stringCodec: ValueCodec<string> = {
  encode: (value, defaultValue) => {
    if (value === defaultValue) {
      return ok(undefined);
    }
    try {
      return ok(encodeURIComponent(value));
    } catch (cause) {
      return error(new Error(`Unable to encode string "${value}"`, { cause }));
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    try {
      return ok(decodeURIComponent(encodedValue));
    } catch (cause) {
      return error(
        new Error(`Unable to decode string from "${encodedValue}"`, { cause })
      );
    }
  },
};

export default stringCodec;
