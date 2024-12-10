import { ValueCodec } from '../lib/types';
import deepEquals from '../lib/deepEquals';
import { error, ok } from '../lib/result';

/**
 * Encodes an arbitrary JSON-serializable value (including objects and
 * strings with multi-byte characters) as a UTF-8 base64 string.
 *
 * **Warning:** This uses the native `btoa` and `atob` global functions
 * for base64 encoding and decoding. Although these are available in all
 * major runtimes, including Deno and Bun, they are marked as "legacy"
 * in the Node.js documentation. There are no other standards for
 * encoding to base64 or similar schemes, but it is still conceivable
 * that some future version of Node will remove these functions in favor
 * of its proprietary `Buffer` API. In such a case, it will be necessary
 * to shim them into `globalThis`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
 * @see https://nodejs.org/docs/v20.15.0/api/globals.html#btoadata
 * @see https://nodejs.org/docs/v20.15.0/api/globals.html#atobdata
 */
const base64JsonCodec: ValueCodec<unknown> = {
  encode: (value, defaultValue) => {
    try {
      if (defaultValue !== undefined && deepEquals(value, defaultValue)) {
        return ok(undefined);
      }
      const stringifiedValue = JSON.stringify(value);
      const utf8Encoder = new TextEncoder();
      const utf8Bytes = utf8Encoder.encode(stringifiedValue);
      const utf8ByteStrings = Array.from(utf8Bytes, (byte) =>
        String.fromCodePoint(byte)
      );
      const utf8ByteString = utf8ByteStrings.join('');
      const base64EncodedValue = btoa(utf8ByteString);
      return ok(base64EncodedValue);
    } catch (cause) {
      return error(
        new Error('Unable to encode JSON value as base64', { cause })
      );
    }
  },
  decode: (value, defaultValue) => {
    if (value === undefined) {
      return ok(defaultValue);
    }
    try {
      const utf8ByteString = atob(value);
      const utf8Bytes = Uint8Array.from(
        utf8ByteString,
        (byteCharacter) => byteCharacter.codePointAt(0)!
      );
      const utf8Decoder = new TextDecoder();
      const decodedString = utf8Decoder.decode(utf8Bytes);
      const parsedJsonValue = JSON.parse(decodedString);
      return ok(parsedJsonValue);
    } catch (cause) {
      return error(new Error(`Unable to decode value as base64`, { cause }));
    }
  },
};

export default base64JsonCodec;
