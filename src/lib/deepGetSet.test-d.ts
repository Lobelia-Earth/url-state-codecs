import { assertType, describe, test } from 'vitest';
import { GetNestedType, SetNestedType } from './deepGetSet';

describe('deepGetSet types', () => {
  test('GetNestedType', () => {
    const test = {
      a: {
        b: [{ c: { d: 1 } }],
      },
    };

    type D = GetNestedType<typeof test, ['a', 'b', number, 'c', 'd']>;

    assertType<D>(1);
  });

  test('SetNestedType', () => {
    const expected = {
      a: {
        b: [{ c: { d: 'e' } }],
      },
    };

    type Actual = SetNestedType<['a', 'b', number, 'c', 'd'], string>;

    assertType<Actual>(expected);
  });
});
