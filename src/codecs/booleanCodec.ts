import { ValueCodec } from '../lib/types';
import { error, ok } from '../lib/result';

export const encodedTrue = 'true';
export const encodedFalse = 'false';

const booleanCodec: ValueCodec<boolean> = {
  encode: (value, defaultValue) => {
    if (value === defaultValue) {
      return ok(undefined);
    }
    try {
      return ok(encodeURIComponent(value));
    } catch (cause) {
      return error(new Error(`Unable to encode boolean "${value}"`, { cause }));
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    if (encodedValue === encodedTrue) {
      return ok(true);
    } else if (encodedValue === encodedFalse) {
      return ok(false);
    }
    return error(
      new Error(
        `Expected encoded boolean value to be "${encodedTrue}" or "${encodedFalse}", saw "${encodedValue}"`
      )
    );
  },
};

export default booleanCodec;
