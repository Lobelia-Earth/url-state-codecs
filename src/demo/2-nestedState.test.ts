import { assert, describe, expect, test } from 'vitest';
import { ValueCodec, defineState } from '../main';
import arrayOf from '../codecs/wrappers/arrayOf';
import numberCodec from '../codecs/numberCodec';
import stringCodec from '../codecs/stringCodec';
import iso8601DateCodec from '../codecs/iso8601DateCodec';
import nullable from '../codecs/wrappers/nullable';
import base64JsonCodec from '../codecs/base64JsonCodec';
import withRfc6902JsonPatch from '../codecs/wrappers/withRfc6902JsonPatch';
import withDeflateRaw from '../codecs/wrappers/withDeflateRaw';

/**
 * Now let's try something a little more complicated.
 */
interface NestedMapState {
  mapControls: {
    center: [lat: number, lon: number];
    zoom: number;
    projection: string;
  };
  dataParameters: {
    startDate: Date | null;
    endDate: Date | null;
  };
  mapLayers: Record<
    string,
    {
      id: string;
      zIndex: number;
      visible: boolean;
      valueMin: number;
      valueMax: number;
      valueClamp?: boolean;
      colorMapId?: string;
    }
  >;
}

describe('Demo: nested state', () => {
  const defaultState: NestedMapState = {
    mapControls: {
      center: [0, 0],
      zoom: 5,
      projection: 'EPSG:3857',
    },
    dataParameters: {
      startDate: new Date('2018-11Z'),
      endDate: new Date('2024-09Z'),
    },
    mapLayers: {
      'EO:LOBELIA:DAT:TEST-123': {
        id: 'EO:LOBELIA:DAT:TEST-123',
        zIndex: 3,
        visible: true,
        valueMin: 0,
        valueMax: 1,
      },
      'EO:LOBELIA:DAT:TEST-456': {
        id: 'EO:LOBELIA:DAT:TEST-456',
        zIndex: 2,
        visible: true,
        valueMin: 0,
        valueMax: 1,
        valueClamp: true,
        colorMapId: 'cyclic',
      },
      'EO:LOBELIA:DAT:TEST-789': {
        id: 'EO:LOBELIA:DAT:TEST-789',
        zIndex: 1,
        visible: true,
        valueMin: 0,
        valueMax: 1,
      },
    },
  };

  const { root, createStateCodec } = defineState(defaultState);
  const mapControls = root.nested('mapControls');
  const dataParameters = root.nested('dataParameters');

  const nullableDateCodec = nullable(iso8601DateCodec);
  const mapLayersCodec = base64JsonCodec as ValueCodec<
    NestedMapState['mapLayers']
  >;
  const diffedMapLayersCodec = withRfc6902JsonPatch(mapLayersCodec);
  const compressedDiffCodec = withDeflateRaw(diffedMapLayersCodec);

  const mc = mapControls.connect('center', 'mc', arrayOf(numberCodec, 'x', 2));
  const mz = mapControls.connect('zoom', 'mz', numberCodec);
  const mp = mapControls.connect('projection', 'mp', stringCodec);
  const ds = dataParameters.connect('startDate', 'ds', nullableDateCodec);
  const de = dataParameters.connect('endDate', 'de', nullableDateCodec);
  const mls = root.connect('mapLayers', 'mls', compressedDiffCodec);

  const stateCodec = createStateCodec([mc, mz, mp, ds, de, mls]);

  test('Encoding an updated state to a params object and back', () => {
    const tweakedState: NestedMapState = {
      ...defaultState,
      mapControls: {
        ...defaultState.mapControls,
        center: [42.413010041680124, 2.1616753549186805],
        projection: 'EPSG:32661',
      },
      mapLayers: {
        'EO:LOBELIA:DAT:TEST-123':
          defaultState.mapLayers['EO:LOBELIA:DAT:TEST-123'],
        'EO:LOBELIA:DAT:TEST-456': {
          ...defaultState.mapLayers['EO:LOBELIA:DAT:TEST-456'],
          visible: false,
        },
        'EO:LOBELIA:DAT:TEST-789': {
          ...defaultState.mapLayers['EO:LOBELIA:DAT:TEST-789'],
          visible: false,
        },
        'EO:LOBELIA:DAT:TEST-0AB': {
          id: 'EO:LOBELIA:DAT:TEST-0AB',
          visible: true,
          zIndex: 4,
          valueMin: 0,
          valueMax: 1,
        },
      },
    };

    const encodeResult = stateCodec.encodeAs.paramsObject(tweakedState);
    assert(encodeResult.ok);

    // Changed state
    expect(encodeResult.data.mc).toBe('42.413010041680124x2.1616753549186805');
    expect(encodeResult.data.mp).toBe('EPSG%3A32661');
    expect(typeof encodeResult.data.mls).toBe('string');

    // Unchanged state
    expect(encodeResult.data.mz).toBe(undefined);
    expect(encodeResult.data.ds).toBe(undefined);
    expect(encodeResult.data.de).toBe(undefined);

    const decodeResult = stateCodec.decodeFrom.paramsObject(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(tweakedState);
  });
});
