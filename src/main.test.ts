import { assert, describe, expect, test } from 'vitest';
import { ValueCodec, defineState } from './main';
import { ok, error } from './lib/result';

describe('defineState', () => {
  interface State {
    a: number;
    b: {
      c: number;
    };
  }

  const defaultState: State = {
    a: 1,
    b: {
      c: 2,
    },
  };

  test('with mock ok codecs', () => {
    const mockNumberCodec: ValueCodec<number> = {
      encode: () => ok('1'),
      decode: () => ok(1),
    };

    const mockUndefinedCodec: ValueCodec<any> = {
      encode: () => ok(undefined),
      decode: () => ok(undefined),
    };

    const { root, createStateCodec } = defineState(defaultState);
    const b = root.nested('b');

    const a = root.connect('a', 'a', mockNumberCodec);
    const c = b.connect('c', 'c', mockUndefinedCodec);

    const stateCodec = createStateCodec([a, c]);

    const encodeDefaultResult =
      stateCodec.encodeAs.urlSearchString(defaultState);
    assert(encodeDefaultResult.ok);
    expect(encodeDefaultResult.data).toEqual('a=1');

    const decodeEmptyResult = stateCodec.decodeFrom.urlSearchString('');
    assert(decodeEmptyResult.ok);
    expect(decodeEmptyResult.data).toEqual(defaultState);
  });

  test('with mock error codecs', () => {
    const mockErrorCodec: ValueCodec<any> = {
      encode: () => error(new Error()),
      decode: () => error(new Error()),
    };

    const { root, createStateCodec } = defineState(defaultState);
    const b = root.nested('b');

    const a = root.connect('a', 'a', mockErrorCodec);
    const c = b.connect('c', 'c', mockErrorCodec);
    const stateCodec = createStateCodec([a, c]);

    const encodeResult = stateCodec.encodeAs.urlSearchString(defaultState);
    assert(!encodeResult.ok);

    const decodeResult = stateCodec.decodeFrom.urlSearchString('a=3&c=4');
    assert(!decodeResult.ok);
    assert(Array.isArray(decodeResult.error.cause));
    expect(decodeResult.error.cause.length).toBe(2);
  });
});
