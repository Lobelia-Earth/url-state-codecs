import { assert, describe, expect, test } from 'vitest';
import numberCodec from './numberCodec';

describe('numberCodec', () => {
  test('Integer', () => {
    const encodeResult = numberCodec.encode(1);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('1');

    const decodeResult = numberCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(1);
  });

  test('Integer with default', () => {
    const encodeResult = numberCodec.encode(1, 1);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = numberCodec.decode(undefined, 1);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(1);
  });

  test('Very large numbers', () => {
    const encodedPlus = encodeURIComponent('+');
    const encodePositiveResult = numberCodec.encode(Number.MAX_VALUE);
    assert(encodePositiveResult.ok);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_VALUE
    expect(encodePositiveResult.data).toBe(
      `1.7976931348623157e${encodedPlus}308`
    );

    const decodePositiveResult = numberCodec.decode(encodePositiveResult.data);
    assert(decodePositiveResult.ok);
    expect(decodePositiveResult.data).toBe(Number.MAX_VALUE);

    const encodedNegativeResult = numberCodec.encode(Number.MIN_VALUE);
    assert(encodedNegativeResult.ok);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_VALUE
    expect(encodedNegativeResult.data).toBe('5e-324');

    const decodedNegativeResult = numberCodec.decode(
      encodedNegativeResult.data
    );
    assert(decodedNegativeResult.ok);
    expect(decodedNegativeResult.data).toBe(Number.MIN_VALUE);
  });

  test('+/- Infinity', () => {
    const encodePositiveResult = numberCodec.encode(Infinity);
    assert(encodePositiveResult.ok);
    expect(encodePositiveResult.data).toBe('Infinity');

    const decodePositiveResult = numberCodec.decode(encodePositiveResult.data);
    assert(decodePositiveResult.ok);
    expect(decodePositiveResult.data).toBe(Infinity);

    const encodedNegativeResult = numberCodec.encode(-Infinity);
    assert(encodedNegativeResult.ok);
    expect(encodedNegativeResult.data).toBe('-Infinity');

    const decodedNegativeResult = numberCodec.decode(
      encodedNegativeResult.data
    );
    assert(decodedNegativeResult.ok);
    expect(decodedNegativeResult.data).toBe(-Infinity);
  });

  test('NaN without the withNaN() wrapper', () => {
    const encodeResult = numberCodec.encode(NaN);
    assert(!encodeResult.ok);

    const decodeResult = numberCodec.decode('NaN');
    assert(!decodeResult.ok);
  });
});
