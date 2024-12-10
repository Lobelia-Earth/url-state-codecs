import { assert, describe, expect, test } from 'vitest';
import iso8601DateCodec from './iso8601DateCodec';

describe('iso8601DateCodec', () => {
  const encodedColon = encodeURIComponent(':');

  test('Simple date, no default', () => {
    const dateString = '2000-01-01T00:00:00.000Z';
    const escapedDateString = dateString.replaceAll(':', encodedColon);

    const encodeResult = iso8601DateCodec.encode(new Date(dateString));
    assert(encodeResult.ok);
    expect(encodeResult.data).toEqual(escapedDateString);

    const decodeResult = iso8601DateCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(new Date(dateString));
  });

  test('Identical default', () => {
    const dateString = '2000-01-01T00:00:00.000Z';

    const encodeResult = iso8601DateCodec.encode(
      new Date(dateString),
      new Date(dateString)
    );
    assert(encodeResult.ok);
    expect(encodeResult.data).toEqual(undefined);

    const decodeResult = iso8601DateCodec.decode(
      encodeResult.data,
      new Date(dateString)
    );
    assert(decodeResult.ok);
    expect(decodeResult.data).toEqual(new Date(dateString));
  });

  test('Invalid dates', () => {
    const dateStringWithTypo = '2000-01-01Y00:00:00.000Z';

    const encodeResult = iso8601DateCodec.encode(new Date(dateStringWithTypo));
    assert(!encodeResult.ok);

    const decodeResult = iso8601DateCodec.decode(
      dateStringWithTypo.replaceAll(':', encodedColon)
    );
    assert(!decodeResult.ok);
  });
});
