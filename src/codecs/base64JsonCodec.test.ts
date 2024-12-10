import { assert, describe, expect, test } from 'vitest';
import base64JsonCodec from './base64JsonCodec';

describe('base64JsonCodec', () => {
  test('Primitive value, no default', () => {
    const encodeResult = base64JsonCodec.encode('a');
    assert(encodeResult.ok);

    const decodeResult = base64JsonCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe('a');
  });

  test('Simple object, no default', () => {
    const encodeResult = base64JsonCodec.encode({ a: 1 });
    assert(encodeResult.ok);

    const decodeResult = base64JsonCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual({ a: 1 });
  });

  test('Simple object, default with unserializable differences', () => {
    const defaultState = {
      a: 1,
      b: 2,
    };

    const d = Symbol('d');
    const newState = { ...defaultState, c: () => 3, [d]: 4 };

    const encodeResult = base64JsonCodec.encode(newState, defaultState);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = base64JsonCodec.decode(
      encodeResult.data,
      defaultState
    );
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(defaultState);
  });

  test('Nested object, subtly different default', () => {
    const defaultState = {
      a: 1,
      b: {
        c: 2,
      },
    };

    const newState = {
      ...defaultState,
      b: {
        c: 3,
      },
    };

    const encodeResult = base64JsonCodec.encode(newState, defaultState);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBeTypeOf('string');

    const decodeResult = base64JsonCodec.decode(
      encodeResult.data,
      defaultState
    );
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(newState);
  });
});
