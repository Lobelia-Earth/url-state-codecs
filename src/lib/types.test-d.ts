import { assertType, describe, test } from 'vitest';
import {
  Connection,
  StateRootFromConnection,
  TupleOfTypeAndLength,
} from './types';

describe('types', () => {
  test('TupleOfTypeAndLength', () => {
    assertType<TupleOfTypeAndLength<number, 2>>([0, 0]);
    assertType<TupleOfTypeAndLength<string, 6>>(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  test('StateRootFromConnection', () => {
    interface Root {
      a: number;
    }
    const root: Root = { a: 1 };
    assertType<StateRootFromConnection<Connection<Root, ['a'], 'a'>>>(root);
  });
});
