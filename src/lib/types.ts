import { GetNestedType } from './deepGetSet';
import { Result } from './result';

/**
 * Indexing with symbols is theoretically possible but introduces type
 * complexities that are too difficult to resolve (for now).
 */
export type SimpleKey = string | number;

/**
 * For a given type `T` and a tuple length `L`, create a tuple type of
 * length `L`. `Accumulator` is for internal recursive purposes only.
 */
export type TupleOfTypeAndLength<
  T,
  L extends number,
  Accumulator extends T[] = [],
> = number extends L
  ? // L must be a number literal, not just `number`.
    never
  : Accumulator['length'] extends L
    ? Accumulator
    : TupleOfTypeAndLength<T, L, [...Accumulator, T]>;

/**
 * An encoder/decoder pair for working with individual values within a
 * state or other object.
 */
export interface ValueCodec<DecodedValue> {
  encode: (
    value: DecodedValue,
    defaultValue?: DecodedValue
  ) => Result<string | undefined>;
  decode: (
    encodedValue?: string,
    defaultValue?: DecodedValue
  ) => Result<DecodedValue | undefined>;
}

/**
 * Used to define a connection between a part (`StatePath`) of a state
 * tree (`StateRoot`) and a URL parameter (`UrlParameter`).
 */
export interface Connection<
  StateRoot,
  StatePath extends SimpleKey[],
  UrlParameter extends string,
> {
  /**
   * The path from the root of the state to the value being connected.
   */
  statePath: StatePath;
  /**
   * The default value to use as a mask. The codec should encoded
   * `undefined` if there is no difference using deep object equality
   * between `defaultValue` and the passed value. The decoded should
   * supply `defaultValue` if the passed URL parameter value is
   * `undefined`.
   */
  defaultValue: GetNestedType<StateRoot, StatePath>;
  /**
   * The name of the URL parameter to encode to and decode from.
   */
  urlParameter: UrlParameter;
  codec: ValueCodec<GetNestedType<StateRoot, StatePath>>;
}

/**
 * Extract the `StateRoot` type variable from a `Connection`.
 */
export type StateRootFromConnection<C> =
  C extends Connection<infer SR, SimpleKey[], string> ? SR : never;

/**
 * Used in the context of combining `ValueCodec`s into a single codec
 * that encodes the entire application state (as represented by an
 * arbtirary object) into URL parameters - as a plain object,
 * `URLSearchParams` object, or search string - and back.
 */
export interface StateCodec<StateTree, URLParamName extends string> {
  encodeAs: {
    paramsObject: (state: StateTree) => Result<Record<URLParamName, string>>;
    urlSearchParams: (state: StateTree) => Result<URLSearchParams>;
    urlSearchString: (state: StateTree) => Result<string>;
  };
  decodeFrom: {
    paramsObject: (
      paramsObject: Record<URLParamName, string>
    ) => Result<StateTree>;
    urlSearchParams: (urlSearchParams: URLSearchParams) => Result<StateTree>;
    urlSearchString: (urlSearchString: string) => Result<StateTree>;
  };
}
