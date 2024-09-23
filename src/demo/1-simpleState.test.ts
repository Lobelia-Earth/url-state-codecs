import { assert, describe, expect, test } from 'vitest';
import { defineState } from '../main';
import stringCodec from '../codecs/stringCodec';
import numberCodec from '../codecs/numberCodec';
import nullable from '../codecs/wrappers/nullable';

/**
 * Let's say this is the shape of the application state we want to
 * encode.
 */
interface SimpleMapState {
  latitude: number;
  longitude: number;
  zoom: number;
  name: string | null;
}

describe('Demo: simple state', () => {
  // If you have a default state, it can be used to mask redundant
  // parameters so that only changes are encoded.
  const defaultState: SimpleMapState = {
    latitude: 0,
    longitude: 0,
    zoom: 3,
    name: null,
  };

  // defineState() infers the type of the application state tree from
  // defaultState. It also accepts an optional type argument if you
  // don't want to pass in a default state.
  const { createStateCodec, root } = defineState(defaultState);

  // The type definitions won't let you connect to a property that
  // doesn't exist:
  // const x = root.connect('asdf', 'x', numberCodec);

  // ...or use a codec with the wrong type signature:
  // const x = root.connect('longitude', 'x', stringCodec);

  const x = root.connect('longitude', 'x', numberCodec);
  const y = root.connect('latitude', 'y', numberCodec);
  const z = root.connect('zoom', 'z', numberCodec);
  const n = root.connect('name', 'n', nullable(stringCodec));

  const stateCodec = createStateCodec([x, y, z, n]);

  test('Encoding all-new values to a params object and back', () => {
    const calcotadaMap: SimpleMapState = {
      latitude: 41.238648049825535,
      longitude: 1.8537583693256325,
      zoom: 15,
      name: 'Calçotada 2024',
    };

    const encodeResult = stateCodec.encodeAs.paramsObject(calcotadaMap);

    // Vitest comes with an assertion function that has a thorough
    // TypeScript definition. Similar to condition blocks, well-typed
    // assertion functions in TypeScript result in type narrowing
    // because TypeScript knows that no code below the assertion
    // function will be executed if the assertion fails.
    assert(encodeResult.ok);

    expect(encodeResult.data).toEqual({
      x: '1.8537583693256325',
      y: '41.238648049825535',
      z: '15',
      n: 'Cal%C3%A7otada%202024',
    });

    const decodeResult = stateCodec.decodeFrom.paramsObject(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(calcotadaMap);
  });

  test('Encoding a minor change to the default state as a URL search string and back', () => {
    const tweakedState = { ...defaultState, zoom: 4 };
    const encodeResult = stateCodec.encodeAs.urlSearchString(tweakedState);
    assert(encodeResult.ok);

    // Only the state that differs from the default (`zoom`) is encoded.
    expect(encodeResult.data).toEqual('z=4');

    const decodeResult = stateCodec.decodeFrom.urlSearchString(
      encodeResult.data
    );
    assert(decodeResult.ok);

    // Missing state (in this case, everything but `zoom`) is rehydrated
    // from default values.
    expect(decodeResult.data).toEqual(tweakedState);
  });
});
