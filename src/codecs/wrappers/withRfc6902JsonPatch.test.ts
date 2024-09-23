import { assert, describe, expect, test, vi } from 'vitest';
import { Operation } from 'fast-json-patch';
import withRfc6902JsonPatch from './withRfc6902JsonPatch';
import { ValueCodec, ok } from '../../main';

describe('withRfc6902JsonPatch', () => {
  test('Single object property change', () => {
    const mockCodec: ValueCodec<unknown> = {
      encode: vi.fn(),
      decode: (value) => ok(value),
    };

    const mockCodecWithPatch = withRfc6902JsonPatch(mockCodec);
    const defaultState = { a: 1 };
    const mutatedState = { a: 2 };

    mockCodecWithPatch.encode(mutatedState, defaultState);
    const expectedOperations: Operation[] = [
      { op: 'replace', path: '/a', value: 2 },
    ];
    expect(mockCodec.encode).toHaveBeenCalledWith(expectedOperations);

    const decodeResult = mockCodecWithPatch.decode(
      expectedOperations as unknown as string,
      defaultState
    );
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(mutatedState);
  });

  test('Invalid JSON, invalid patch', () => {
    const mockCodec: ValueCodec<unknown> = {
      encode: vi.fn(),
      decode: (value) => ok(value),
    };

    const mockCodecWithPatch = withRfc6902JsonPatch(mockCodec);
    const defaultState = { a: 1 };

    const unserializableState = {
      ...defaultState,
      get b(): number {
        return this.c;
      },
      get c(): number {
        return this.b;
      },
    };
    const encodeResult = mockCodecWithPatch.encode(
      unserializableState,
      defaultState
    );
    assert(!encodeResult.ok);

    const corruptedOperations = [{ op: 'replaceeee', path: '/a', value: 2 }];
    const decodeResult = mockCodecWithPatch.decode(
      corruptedOperations as unknown as string,
      defaultState
    );
    assert(!decodeResult.ok);
  });
});
