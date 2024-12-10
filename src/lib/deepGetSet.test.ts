import { describe, test, expect } from 'vitest';
import { getDeep, setDeep } from './deepGetSet';

describe('getDeep()', () => {
  test('Shallow object property retrieval', () => {
    const source = { a: 1, b: 2 };
    expect(getDeep(source, 'b')).toBe(2);
  });

  test('Shallow array element retrieval', () => {
    const source = [1, 2, 3];
    expect(getDeep(source, 1)).toBe(2);
  });

  test('Deep mixed object/array retrieval', () => {
    const source = {
      a: {
        b: [{ c: 1 }],
      },
    };

    expect(getDeep(source, 'a', 'b', 0, 'c')).toBe(1);
  });
});

describe('setDeep()', () => {
  test('Shallow object update', () => {
    const target = { a: 1 };
    setDeep(target, ['a'], 2);
    expect(target).toEqual({ a: 2 });
  });

  test('Shallow array update', () => {
    const target = [0, 1, 2];
    setDeep(target, [0], 1);
    setDeep(target, [1], 2);
    setDeep(target, [2], 3);
    expect(target).toEqual([1, 2, 3]);
  });

  test('Deep mixed object/array update', () => {
    const target = {
      a: {
        b: [{ c: 1 }],
      },
    };

    setDeep(target, ['a', 'b', 1], { c: 2 });
    expect(target).toEqual({
      a: {
        b: [{ c: 1 }, { c: 2 }],
      },
    });
  });
});
