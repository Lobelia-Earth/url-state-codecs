/**
 * Represents the successful result of an operation that could have
 * failed.
 */
export interface OkResult<T> {
  ok: true;
  data: T;
}

/**
 * Represents any error result. Generally, it’s fine to write functions
 * that consume `ErrorResult`, but you may want to consider avoiding
 * functions that produce them unless you're sure you don't need the
 * data type `T` from `Result<T>`.
 */
export interface ErrorResult {
  ok: false;
  error: Error;
}

/**
 * The concept of a `Result` object is borrowed from statically typed,
 * functional programming languages. It circumvents the limitations and
 * ambiguities of JavaScript’s imperative try-catch flow and forces
 * callers of functions that return `Result` objects to be intentional
 * about handling potential errors.
 *
 * To access the `data` inside a result, use type narrowing by checking
 * the `ok` property first:
 *
 * ```ts
 * result.ok && console.log(result.data);
 * ```
 */
export type Result<T> = OkResult<T> | ErrorResult;

/**
 * For any given `Result<T>`, extracts `T`.
 */
export type ResultDataType<R extends Result<unknown>> =
  R extends OkResult<unknown> ? R['data'] : never;

/**
 * Creates an `OkResult` by wrapping `data: T`.
 */
export const ok = <T>(data: T): OkResult<T> => ({
  ok: true,
  data,
});

/**
 * Creates an `ErrorResult` by wrapping any `Error` instance. Although
 * it would be a superficially more convenient API for this function to
 * accept an error message and construct the error object here, it's
 * important to construct the `Error` instance closest to the place
 * where the error actually originates to avoid misleading stack traces.
 */
export const error = (error: Error): ErrorResult => ({
  ok: false,
  error,
});
