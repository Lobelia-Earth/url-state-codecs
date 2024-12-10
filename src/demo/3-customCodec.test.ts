import { assert, describe, expect, test } from 'vitest';
import { ValueCodec, error, ok } from '../main';
import deepEquals from '../lib/deepEquals';

// This is a demonstration of how to create a custom value codec using
// the game of tic-tac-toe (a.k.a "noughts and crosses").
//
// https://en.wikipedia.org/wiki/Tic-tac-toe

type Cell = null | 'x' | 'o';
type Row = [Cell, Cell, Cell];
type Grid = [Row, Row, Row];

describe('Demo: custom codec', () => {
  // This will encode and decode `Grid` arrays as serialized strings of
  // 'x', 'o', and '-' characters without a separator.
  const ticTacToeCodec: ValueCodec<Grid> = {
    encode: (value, defaultValue) => {
      if (!value || deepEquals(value, defaultValue)) {
        return ok(undefined);
      }
      const characters = value.flatMap((row) =>
        row.map((cell) => (cell === null ? '-' : cell))
      );
      return ok(characters.join(''));
    },
    decode: (encodedValue, defaultValue) => {
      if (!encodedValue) {
        return ok(defaultValue);
      }
      const characters = encodedValue.split('');
      if (characters.length !== 9) {
        return error(
          new Error(
            `Error decoding tic-tac-toe grid. Expected 9 cells. Saw ${characters.length}.`
          )
        );
      }

      const characterDecodingMap = {
        '-': null,
        x: 'x',
        o: 'o',
      } as const satisfies Record<string, Cell>;

      const possibleValidCharacters = Object.keys(characterDecodingMap);
      const invalidCharacters = characters.filter(
        (character) => !possibleValidCharacters.includes(character)
      );
      if (invalidCharacters.length) {
        return error(
          new Error(
            `Encountered invalid characters in encoded tic-tac-toe grid "${encodedValue}": ${invalidCharacters
              .map((character) => `"${character}"`)
              .join(', ')}`
          )
        );
      }

      const decodedCharacters = characters.map(
        (character) =>
          characterDecodingMap[character as keyof typeof characterDecodingMap]
      );

      const grid: Row[] = [];
      for (let rowI = 0; rowI <= 2; rowI += 1) {
        const characterOffset = rowI * 3;
        const row = [
          decodedCharacters[characterOffset],
          decodedCharacters[characterOffset + 1],
          decodedCharacters[characterOffset + 2],
        ];
        grid[rowI] = row as Row;
      }
      return ok(grid as Grid);
    },
  };

  test('Empty grid', () => {
    const emptyGrid: Grid = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    const encodeResult = ticTacToeCodec.encode(emptyGrid);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('---------');

    const decodeResult = ticTacToeCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(emptyGrid);
  });

  test('Non-empty grid', () => {
    const nonEmptyGrid: Grid = [
      ['o', null, 'o'],
      [null, 'x', null],
      ['x', 'x', null],
    ];

    const encodeResult = ticTacToeCodec.encode(nonEmptyGrid);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('o-o-x-xx-');

    const decodeResult = ticTacToeCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(nonEmptyGrid);
  });
});
