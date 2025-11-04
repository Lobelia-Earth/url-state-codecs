import { assert, describe, expect, test } from 'vitest';
import unionOfLiterals from './unionOfLiterals';

describe('unionOfLiterals', () => {
  describe('Simple union of strings and numbers', () => {
    const unionCodec = unionOfLiterals(['a', 'b', 'c', 1, 2, 3]);

    test('Valid value to encode without default', () => {
      const encodeResult = unionCodec.encode('a');
      assert(encodeResult.ok);
      expect(encodeResult.data).toBe('a');
    });

    test('Invalid value to encode', () => {
      // @ts-expect-error
      const encodeResult = unionCodec.encode('d');
      assert(!encodeResult.ok);
    });

    test('Valid value to decode', () => {
      const decodeResult = unionCodec.decode('2');
      assert(decodeResult.ok);
      expect(decodeResult.data).toBe(2);
    });

    test('Value to decode is not a member', () => {
      const decodeResult = unionCodec.decode('d');
      assert(!decodeResult.ok);
    });
  });

  test('Decode type ambiguity resolution', () => {
    const unionCodec = unionOfLiterals([1, '1', 2, '2', 3, '3']);
    const decodeResult = unionCodec.decode('2');
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(2);
  });

  test('Invalid union', () => {
    expect(() => {
      // @ts-expect-error
      unionOfLiterals([1, 2, { five: 'Three, sir' }]);
    }).toThrowError();
  });
});
