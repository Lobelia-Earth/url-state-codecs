import { compare, applyPatch, Operation } from 'fast-json-patch';
import { ValueCodec } from '../../lib/types';
import { error, ok } from '../../lib/result';
import deepCopyJson from '../../lib/deepCopyJson';

/**
 * This wrapper reduces the encoded size of deeply nested data
 * structures, particularly when their contents are mostly the same as
 * their defaults. It wraps any `ValueCodec` that accepts
 * JSON-serializable values - typically the `base64JsonCodec` - with an
 * additional encoding and decoding step. The encoder generates a patch
 * based on the difference between the `value` and `defaultValue`
 * arguments. This encoded patch is an RFC-6902 compliant,
 * JSON-serializable object. The decoder takes such a patch and applies
 * it to the default value to rehydrate the original object.
 *
 * **Note:** It's recommended to also use this with a compression
 * wrapper (e.g. `withDeflateRaw()`) to reduce size.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6902
 */
const withRfc6902JsonPatch = <T>(codec: ValueCodec<T>): ValueCodec<T> => ({
  encode: (value, defaultValue) => {
    if (typeof value !== 'object' || typeof defaultValue !== 'object') {
      return codec.encode(value);
    }
    try {
      // fast-json-patch has the type signatures for these arguments
      // wrong. These are object constructors. They problably wanted
      // something more like `Record<string | number, unknown>`.
      const patch = compare(defaultValue as Object, value as Object);
      return codec.encode(patch as T);
    } catch (cause) {
      return error(
        new Error(
          'Unable to diff defaultValue and value. Are these both valid JSON-serializable values?',
          { cause }
        )
      );
    }
  },
  decode: (encodedValue, defaultValue) => {
    const decodeResult = codec.decode(encodedValue, defaultValue);
    if (!decodeResult.ok || typeof decodeResult.data !== 'object') {
      return decodeResult;
    }
    try {
      const completeValue = deepCopyJson(defaultValue);
      applyPatch(completeValue, decodeResult.data as Operation[]);
      return ok(completeValue as T);
    } catch (cause) {
      return error(
        new Error(
          'Unable to patch the decoded delta into defaultValue. Are these valid JSON-serializable values? Is the patch RFC-6902 compliant?',
          { cause }
        )
      );
    }
  },
});

export default withRfc6902JsonPatch;
