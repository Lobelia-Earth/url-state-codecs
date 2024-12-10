import { assert, describe, expect, test } from 'vitest';
import stringCodec from './stringCodec';

describe('stringCodec', () => {
  test('Simple string without default', () => {
    const encodeResult = stringCodec.encode('a');
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('a');

    const decodeResult = stringCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe('a');
  });

  test('Simple string with same default', () => {
    const encodeResult = stringCodec.encode('a', 'a');
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(undefined);

    const decodeResult = stringCodec.decode(encodeResult.data, 'a');
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe('a');
  });

  test('Empty string without default', () => {
    const encodeResult = stringCodec.encode('');
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('');

    const decodeResult = stringCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe('');
  });

  test('Empty string with default', () => {
    const encodeResult = stringCodec.encode('', 'a');
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe('');

    const decodeResult = stringCodec.decode(encodeResult.data, 'a');
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe('');
  });

  test('String with Greek characters', () => {
    const greek = 'Γνῶθι σαυτόν';

    const encodeResult = stringCodec.encode(greek);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(
      '%CE%93%CE%BD%E1%BF%B6%CE%B8%CE%B9%20%CF%83%CE%B1%CF%85%CF%84%CF%8C%CE%BD'
    );

    const decodeResult = stringCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(greek);
  });

  test('String with multi-grapheme emojis', () => {
    const multiGraphemeEmojis = '👩🏾‍🌾🐈‍⬛👩🏾‍❤️‍💋‍👨🏿🏴‍☠️';

    const encodeResult = stringCodec.encode(multiGraphemeEmojis);
    assert(encodeResult.ok);
    expect(encodeResult.data).toBe(
      '%F0%9F%91%A9%F0%9F%8F%BE%E2%80%8D%F0%9F%8C%BE%F0%9F%90%88%E2%80%8D%E2%AC%9B%F0%9F%91%A9%F0%9F%8F%BE%E2%80%8D%E2%9D%A4%EF%B8%8F%E2%80%8D%F0%9F%92%8B%E2%80%8D%F0%9F%91%A8%F0%9F%8F%BF%F0%9F%8F%B4%E2%80%8D%E2%98%A0%EF%B8%8F'
    );

    const decodeResult = stringCodec.decode(encodeResult.data);
    assert(decodeResult.ok);
    expect(decodeResult.data).toBe(multiGraphemeEmojis);
  });
});
