import { assert, describe, expect, test } from 'vitest';
import arrayOf from './arrayOf';
import numberCodec from '../numberCodec';
import stringCodec from '../stringCodec';
import { TupleOfTypeAndLength } from '../../main';

describe('arrayOf', () => {
  test("arrayOf(numberCodec, 'x')", () => {
    const arrayOfNumbersCodec = arrayOf(numberCodec, 'x');
    const baseValue = [-1, 0, 1];

    const encodeResult = arrayOfNumbersCodec.encode(baseValue);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('-1x0x1');

    const decodeResult = arrayOfNumbersCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data);

    const encodeUnchangedResult = arrayOfNumbersCodec.encode(
      baseValue,
      baseValue
    );
    assert(encodeUnchangedResult.ok);
    expect(encodeUnchangedResult.data).toBe(undefined);

    const encodePartialChangeResult = arrayOfNumbersCodec.encode(
      [...baseValue, 2],
      baseValue
    );
    assert(encodePartialChangeResult.ok);
    expect(encodePartialChangeResult.data).toBe('-1x0x1x2');
  });

  test("arrayOf(numberCodec, '~', 3)", () => {
    const arrayOfNumbersCodec = arrayOf(numberCodec, '~', 3);
    const valueToEncode: TupleOfTypeAndLength<number, 3> = [-1, 0, 1];

    const encodeResult = arrayOfNumbersCodec.encode(valueToEncode);
    assert(encodeResult.ok);
    expect(encodeResult.data).toEqual('-1~0~1');

    const decodeResult = arrayOfNumbersCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(valueToEncode);

    const decodeError = arrayOfNumbersCodec.decode('1~2~3~4');
    expect(decodeError.ok).toBe(false);
  });

  describe("arrayOf(stringCodec, '.')", () => {
    const arrayOfStringsCodec = arrayOf(stringCodec, '.');

    test('Without escaping', () => {
      const valueToEncode = ['a', 'b', 'c'];

      const encodeResult = arrayOfStringsCodec.encode(valueToEncode);
      assert(encodeResult.ok);
      expect(encodeResult.data).toEqual('a.b.c');

      const decodeResult = arrayOfStringsCodec.decode(encodeResult.data);
      assert(decodeResult.ok);
      expect(decodeResult.data).toEqual(valueToEncode);
    });

    test('With escaping', () => {
      const valueToEncode = ['abc', 'def', 'ghi.', 'jkl'];

      const encodeResult = arrayOfStringsCodec.encode(valueToEncode);
      assert(encodeResult.ok);
      expect(encodeResult.data).toEqual('abc.def.ghi%2e.jkl');

      const decodeResult = arrayOfStringsCodec.decode(encodeResult.data);
      assert(decodeResult.ok);
      expect(decodeResult.data).toEqual(valueToEncode);
    });
  });
});
