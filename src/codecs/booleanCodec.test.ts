import { assert, describe, expect, test } from 'vitest';
import booleanCodec, { encodedTrue, encodedFalse } from './booleanCodec';

describe('booleanCodec', () => {
  test('true without default', () => {
    const encodeResult = booleanCodec.encode(true);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(encodedTrue);

    const decodeResult = booleanCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(true);
  });

  test('false without default', () => {
    const encodeResult = booleanCodec.encode(false);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(encodedFalse);

    const decodeResult = booleanCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(false);
  });

  test('true with default', () => {
    const encodeResult = booleanCodec.encode(true, true);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = booleanCodec.decode(encodeResult.data, true);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(true);
  });

  test('false with default', () => {
    const encodeResult = booleanCodec.encode(false, false);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = booleanCodec.decode(encodeResult.data, false);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(false);
  });

  test('invalid encoding', () => {
    const decodeResult = booleanCodec.decode('null');
    assert(!decodeResult.ok);
  });
});
