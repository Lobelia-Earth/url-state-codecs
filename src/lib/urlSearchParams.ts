import { SimpleKey } from './types';

export type UnknownParamsObject = Record<string, string>;

export const urlSearchParamsFromObject = (
  paramsObject: Record<SimpleKey, string | undefined>
): URLSearchParams => {
  const urlSearchParams = new URLSearchParams();
  const paramEntries = Object.entries(paramsObject);
  for (const [key, value] of paramEntries) {
    if (typeof value === 'string') {
      urlSearchParams.set(key, value);
    }
  }
  return urlSearchParams;
};

export const urlSearchParamsToObject = (
  urlSearchParams: URLSearchParams
): UnknownParamsObject => {
  const paramsObject: UnknownParamsObject = {};
  const paramEntries = urlSearchParams.entries();
  for (const [key, value] of paramEntries) {
    paramsObject[key] = value;
  }
  return paramsObject;
};
