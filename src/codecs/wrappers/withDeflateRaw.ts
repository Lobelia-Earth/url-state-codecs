import { ValueCodec } from '../../lib/types';
import { ok, error } from '../../lib/result';
import { deflateRaw, inflateRaw } from 'pako';

/**
 * This wrapper reduces the size of exceptionally large encoded values,
 * e.g. large objects encoded with `base64JsonCodec`, by using the
 * [RFC-1951][1]-compliant DEFLATE compression algorithm without headers
 * or checksum ("raw").
 *
 * [1]: https://www.rfc-editor.org/rfc/rfc1951
 */
const withDeflateRaw = <T>(codec: ValueCodec<T>): ValueCodec<T> => ({
  encode: (value, defaultValue) => {
    const encodeResult = codec.encode(value, defaultValue);
    if (!encodeResult.ok || !encodeResult.data) {
      return encodeResult;
    }
    try {
      const compressedBytes = deflateRaw(encodeResult.data);
      const compressedByteStrings = Array.from(compressedBytes, (byte) =>
        String.fromCodePoint(byte)
      );
      const binaryString = compressedByteStrings.join('');
      const base64EncodedValue = btoa(binaryString);
      return ok(base64EncodedValue);
    } catch (cause) {
      return error(new Error('Deflate raw compression failed', { cause }));
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (!encodedValue) {
      return ok(defaultValue);
    }

    let decompressedString: string;
    try {
      const binaryString = atob(encodedValue);
      const compressedBytes = Uint8Array.from(
        binaryString,
        (byteCharacter) => byteCharacter.codePointAt(0)!
      );
      decompressedString = inflateRaw(compressedBytes, { to: 'string' });
    } catch (cause) {
      return error(new Error('Deflate raw decompression failed', { cause }));
    }
    return codec.decode(decompressedString, defaultValue);
  },
});

export default withDeflateRaw;
