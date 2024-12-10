/**
 * Uses `JSON.stringify()` and `JSON.parse()` to create deep copies of
 * JSON-serializable values.
 */
const deepCopyJson = <T>(jsonSerializableValue: T): T =>
  JSON.parse(JSON.stringify(jsonSerializableValue));

export default deepCopyJson;
