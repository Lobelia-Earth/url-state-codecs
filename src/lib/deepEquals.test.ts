import { describe, expect, test } from 'vitest';
import deepEquals from './deepEquals';

const getBaseObject = () => ({
  b: {
    c: [1, 2, 3],
    d: [
      [4, 5, 6],
      [7, 8, 9],
    ],
  },
});

describe('deepEquals', () => {
  test('Equal nested objects', () => {
    const a = getBaseObject();
    const b = getBaseObject();
    expect(deepEquals(a, b)).toBe(true);
  });

  test('a is subset of b', () => {
    const a = getBaseObject();
    const b = {
      ...getBaseObject(),
      differentProperty: 123,
    };

    expect(deepEquals(a, b)).toBe(false);
  });

  test('a is superset of b', () => {
    const a = {
      b: {
        ...getBaseObject().b,
        d: [...getBaseObject().b.d, [10, 11, 12]],
      },
    };
    const b = getBaseObject();

    expect(deepEquals(a, b)).toBe(false);
  });

  test('Methods and other non-JSON-serializable properties are ignored', () => {
    const methodA = () => 'A';
    const methodB = () => 'B';
    const symbolA = Symbol('A');
    const symbolB = Symbol('B');
    const symbolC = Symbol('C');

    expect(
      deepEquals(
        { a: 1, method: methodA, symbol: symbolA },
        { a: 1, method: methodB, [symbolA]: 2, [symbolB]: symbolC }
      )
    ).toBe(true);
  });
});
