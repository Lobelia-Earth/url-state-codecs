import {
  Connection,
  SimpleKey,
  StateCodec,
  StateRootFromConnection,
  ValueCodec,
} from './lib/types';
import { GetNestedType, getDeep, setDeep } from './lib/deepGetSet';
import { Result, error, ok } from './lib/result';
import arrayIsNotEmpty from './lib/arrayIsNotEmpty';
import {
  urlSearchParamsFromObject,
  urlSearchParamsToObject,
} from './lib/urlSearchParams';

export type * from './lib/types';
export * from './lib/result';

interface CodecConnector<StateRoot, StatePath extends SimpleKey[], StateNode> {
  connect: <
    StateKey extends keyof StateNode & SimpleKey,
    UrlParameter extends string,
  >(
    stateKey: StateKey,
    urlParameter: UrlParameter,
    codec: ValueCodec<StateNode[StateKey]>
  ) => Connection<StateRoot, [...StatePath, StateKey], UrlParameter>;
  nested: <KeyOfNestedState extends keyof StateNode & SimpleKey>(
    keyOfNestedState: KeyOfNestedState
  ) => CodecConnector<
    StateRoot,
    [...StatePath, KeyOfNestedState],
    StateNode[KeyOfNestedState]
  >;
}

interface CodecIngredients<StateRoot> {
  /**
   * Use this to define connections between nodes in your application
   * state object and your URL parameter names.
   */
  root: CodecConnector<StateRoot, [], StateRoot>;
  /**
   * Pass the connections you created with `defineState(state).root`
   * into this factory method to create your application state codec.
   */
  createStateCodec: <C extends Connection<StateRoot, SimpleKey[], string>>(
    connections: C[]
  ) => StateCodec<StateRoot, C['urlParameter']>;
}

const connectState = <
  StateNode,
  StatePath extends SimpleKey[] = [],
  StateRoot = StateNode,
>(
  defaultState: StateNode,
  statePath?: StatePath
): CodecConnector<StateRoot, StatePath, StateNode> => ({
  connect: (stateKey, urlParameter, codec) => ({
    statePath: (statePath ? [...statePath, stateKey] : [stateKey]) as [
      ...StatePath,
      typeof stateKey,
    ],
    defaultValue: defaultState[stateKey] as GetNestedType<
      StateRoot,
      [...StatePath, typeof stateKey]
    >,
    urlParameter,
    codec: codec as ValueCodec<
      GetNestedType<StateRoot, [...StatePath, typeof stateKey]>
    >,
  }),
  nested: (keyOfNestedState) =>
    connectState<
      StateNode[typeof keyOfNestedState],
      [...StatePath, typeof keyOfNestedState],
      StateRoot
    >(
      defaultState[keyOfNestedState],
      (statePath ? [...statePath, keyOfNestedState] : [keyOfNestedState]) as [
        ...StatePath,
        typeof keyOfNestedState,
      ]
    ),
});

export const defineState = <StateRoot>(
  defaultState: StateRoot
): CodecIngredients<StateRoot> => ({
  root: connectState(defaultState, []),
  createStateCodec: (connections) => {
    const stateCodec: StateCodec<
      StateRoot,
      (typeof connections)[number]['urlParameter']
    > = {
      encodeAs: {
        paramsObject: (state) => {
          const paramsObject: Partial<
            Record<(typeof connections)[number]['urlParameter'], string>
          > = {};
          const errors: Error[] = [];

          for (const connection of connections) {
            const stateValue = getDeep(state, ...connection.statePath);
            const encodingResult = connection.codec.encode(
              stateValue,
              connection.defaultValue
            );

            if (!encodingResult.ok) {
              errors.push(encodingResult.error);
              continue;
            }

            if (encodingResult.data === undefined) {
              continue;
            }

            const urlParameter =
              connection.urlParameter as (typeof connections)[number]['urlParameter'];
            paramsObject[urlParameter] = encodingResult.data;
          }

          if (errors.length) {
            return error(
              new Error(
                `Encoding state into URL parameters resulted in ${errors.length} error(s). See cause for details.`,
                { cause: errors }
              )
            );
          }

          return ok(
            paramsObject as Record<
              (typeof connections)[number]['urlParameter'],
              string
            >
          );
        },
        urlSearchParams: (state) => {
          const paramsObjectResult = stateCodec.encodeAs.paramsObject(state);
          return paramsObjectResult.ok
            ? ok(urlSearchParamsFromObject(paramsObjectResult.data))
            : paramsObjectResult;
        },
        urlSearchString: (state) => {
          const urlSearchParamsResult =
            stateCodec.encodeAs.urlSearchParams(state);
          return urlSearchParamsResult.ok
            ? ok(urlSearchParamsResult.data.toString())
            : urlSearchParamsResult;
        },
      },
      decodeFrom: {
        paramsObject: (paramsObject) => {
          const decodedState: Record<SimpleKey, unknown> = {};
          const errors: Error[] = [];

          for (const connection of connections) {
            if (!arrayIsNotEmpty(connection.statePath)) {
              errors.push(
                new Error(
                  `Connect connection for URL parameter "${connection.urlParameter}" contains an empty path to the corresponding state`
                )
              );
              continue;
            }

            const urlParameter =
              connection.urlParameter as (typeof connections)[number]['urlParameter'];
            const encodedValue =
              connection.urlParameter in paramsObject
                ? paramsObject[urlParameter]
                : undefined;

            const decodeResult = connection.codec.decode(
              encodedValue,
              connection.defaultValue
            );

            if (!decodeResult.ok) {
              errors.push(decodeResult.error);
              continue;
            }

            const decodedValue = decodeResult.data ?? connection.defaultValue;
            setDeep(decodedState, connection.statePath, decodedValue);
          }

          if (errors.length) {
            return error(
              new Error(
                `Decoding state from URL parameters resulted in ${errors.length} error(s). See cause for details.`,
                { cause: errors }
              )
            );
          }

          return ok(decodedState) as Result<
            StateRootFromConnection<(typeof connections)[number]>
          >;
        },
        urlSearchParams: (urlSearchParams) => {
          const paramsObject = urlSearchParamsToObject(urlSearchParams);
          return stateCodec.decodeFrom.paramsObject(
            paramsObject as Record<
              (typeof connections)[number]['urlParameter'],
              string
            >
          );
        },
        urlSearchString: (urlSearchString) => {
          try {
            const urlSearchParams = new URLSearchParams(urlSearchString);
            return stateCodec.decodeFrom.urlSearchParams(urlSearchParams);
          } catch (cause) {
            return error(
              new Error(`Unable to parse URL parameters from string`, { cause })
            );
          }
        },
      },
    };

    return stateCodec;
  },
});
