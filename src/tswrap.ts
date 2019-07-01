import { AxiosError, AxiosResponse } from 'axios'
import { Left } from 'fp-ts/lib/Either'
import * as iots from 'io-ts'

export type E = NodeJS.ErrnoException

/**
 * Shorthand for `Promise<NodeJS.ErrnoException | T>`
 * Where `T` is a possible return type.
 *
 * Best paired with an async function.
 *
 * @example
 *  async function getItemById (id: string): tswrap.R<Item> {
 */
export type R<T, ET extends E = E> = Promise<ET | T>

/**
 * Export an actual variable called R so we don't
 * get errors when trying to transpile code to ES5
 * while using this module.
 */
export const R = Promise

/**
 * Shorthand for `tswrap.R<null>`
 * Used for when a function may return an error, but
 * nothing else you may care about.
 */
export type RE = Promise<null | E>

/**
 *
 * @param arg Return value from `tswrap.R<T>`
 *
 * This function is used to check if the value returned from a function
 * that has the return type of `tswrap.R` is an actual error.
 *
 * If this function returns `true`, typescript knows the value
 * is of type `tswrap.E`. If `false`, typescript knows the value
 * is of the type `T` that was passed into `tswrap.R<T>`.
 */
export function isError<K extends E = E> (arg: any): arg is K {
  return arg instanceof Error
}

/**
 *
 * @param promise External promise
 *
 * This function is used to wrap external promises that do not
 * conform to the `tswrap.R` return type.
 *
 * @example
 *  const returnValue = tswrap.wrapPromise<DBEntry>(database.update(id, entry))
 *
 *  if (tswrap.isError(returnValue)) {
 *    ...
 *  }
 */
export function wrapPromise<T, K extends Promise<T> = Promise<T>, ET extends E = E> (promise: K): R<T, ET> {
  return new Promise((resolve) => {
    promise.then((result: T) => {
      return resolve(result)
    }).catch((err: ET) => {
      return resolve(err)
    })
  })
}

/**
 *
 * @param promise Axios Promise
 *
 * Equivalent to `wrapPromise<AxiosResponse<T>>`.
 * Returns either `AxiosResponse<T>`, or `AxiosError`.
 *
 * @example
 *  const response = await wrapAxios<Items>(axios.get('/items'))
 */
export function wrapAxios<T> (promise: Promise<AxiosResponse<T>>): R<AxiosResponse<T>, AxiosError> {
  return wrapPromise<AxiosResponse<T>, Promise<AxiosResponse<T>>, AxiosError>(promise)
}

/**
 *
 * @param arg Return value from `tswrap.wrapAxios<T>`
 *
 * This function is used to check if the return value from
 * `tswrap.wrapAxios<T>` is an `AxiosError`.
 *
 * @example
 *  const response = await wrapAxios<Items>(axios.get('/items'))
 *  if (tswrap.isAxiosError(response)) {
 *    ...
 *  }
 */
export function isAxiosError (arg: any): arg is AxiosError {
  return isError<AxiosError>(arg)
}

/**
 *
 * @param data Object to parse
 * @param structure iots data interface
 *
 * This function will try and decode `data` into `structure`.
 *
 * If successful, it will return type an object of type `T`. If not
 * it will return `Left<iots.Errors, any>` which can be used to report
 * why it was not successfully parsed.
 *
 * @example
 *  const data = parseData<PostBodyInterfaceType>(req.body, PostBodyInterface)
 */
export function parseData<T> (data: any, structure: iots.TypeC<any> | iots.IntersectionC<any>): Left<iots.Errors, any> | T {
  const decoded = structure.decode(data)

  if (decoded.isLeft()) {
    return decoded
  }

  return decoded.value as T
}

/**
 *
 * @param arg Return value of `ts.parseData<T>`
 *
 * This function is used to check if the return value from
 * `tswrap.parseData<T>` is an error (`Left<iots.Errors>`).
 *
 * @example
 *  const data = parseData<PostBodyInterfaceType>(req.body, PostBodyInterface)
 *
 *  if (T.isParseError(data)) {
 *    ...
 *  }
 */
export function isParseError (arg: any): arg is Left<iots.Errors, any> {
  return arg && arg._tag === 'Left'
}
