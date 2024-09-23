import { assert, describe, expect, test } from 'vitest';
import nullable from './nullable';
import booleanCodec from '../booleanCodec';

describe('nullable', () => {
  const nullableBooleanCodec = nullable(booleanCodec);

  test('null without default', () => {
    const encodeResult = nullableBooleanCodec.encode(null);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('null');

    const decodeResult = nullableBooleanCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(null);
  });

  test('null with null default', () => {
    const encodeResult = nullableBooleanCodec.encode(null, null);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = nullableBooleanCodec.decode(encodeResult.data, null);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(null);
  });

  test('Non-null value', () => {
    const encodeResult = nullableBooleanCodec.encode(false, null);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('false');

    const decodeResult = nullableBooleanCodec.decode(encodeResult.data, null);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(false);
  });
});
