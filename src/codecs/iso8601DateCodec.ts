import { ValueCodec } from '../lib/types';
import { error, ok } from '../lib/result';

/**
 * Encodes `Date` objects as URI components and back again.
 *
 * **Warning:** The built-in JavaScript `Date` object does not preserve
 * timezone offset information; all `Date` objects are represented
 * internally in the runtime’s timezone. If you need timezone offsets,
 * consider using a library that does preserve timezones and store dates
 * in your application state as ISO 8601 strings instead.
 *
 * @todo Create an `iso8601TemporalCodec` when the [Temporal API][1]
 * is stable enough to be defined by TypeScript.
 *
 * [1]: https://tc39.es/proposal-temporal/
 */
const iso8601DateCodec: ValueCodec<Date> = {
  encode: (value, defaultValue) => {
    if (value.valueOf() === defaultValue?.valueOf()) {
      return ok(undefined);
    }
    try {
      const isoString = value.toISOString();
      return ok(encodeURIComponent(isoString));
    } catch (cause) {
      return error(
        new Error(`Unable to encode Date as an ISO 8601 string`, { cause })
      );
    }
  },
  decode: (encodedValue, defaultValue) => {
    if (encodedValue === undefined) {
      return ok(defaultValue);
    }
    try {
      const decodedString = decodeURIComponent(encodedValue);
      const decodedValue = new Date(decodedString);
      return isNaN(decodedValue.valueOf())
        ? error(new Error(`Unable to decode date from "${encodedValue}"`))
        : ok(decodedValue);
    } catch (cause) {
      return error(
        new Error(`Unable to decode date from "${encodedValue}"`, { cause })
      );
    }
  },
};

export default iso8601DateCodec;
