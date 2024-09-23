import { assert, describe, expect, test } from 'vitest';
import withNaN, { encodedNaNValue } from './withNaN';
import numberCodec from '../numberCodec';

describe('withNaN', () => {
  const numberWithNaNCodec = withNaN(numberCodec);

  test('NaN without a default', () => {
    const encodeResult = numberWithNaNCodec.encode(NaN);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(encodedNaNValue);

    const decodeResult = numberWithNaNCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBeNaN();
  });

  test('NaN with a number default', () => {
    const encodeResult = numberWithNaNCodec.encode(NaN, 0);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(encodedNaNValue);

    const decodeResult = numberWithNaNCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBeNaN();
  });

  test('NaN with a NaN default', () => {
    const encodeResult = numberWithNaNCodec.encode(NaN, NaN);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = numberWithNaNCodec.decode(encodeResult.data, NaN);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBeNaN();
  });

  test('A number without a default', () => {
    const encodeResult = numberWithNaNCodec.encode(0);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('0');

    const decodeResult = numberWithNaNCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(0);
  });

  test('A number with a NaN default', () => {
    const encodeResult = numberWithNaNCodec.encode(0, NaN);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('0');

    const decodeResult = numberWithNaNCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(0);
  });
});
