# tsu
Random assortment of Typescript utilities, wrappers, and types.

## Premise

Ditch the required usage of `try`/`catch` for `async`/`await` functions.

Return errors normally, utilise typescript types to force errors to be handled.

## Usage

Install it: `npm install tsu --save`

Require it: `import * as tsu from 'tsu'`

## API

### `tsu.R<ReturnType>`

Shorthand for `Promise<NodeJS.ErrnoException | T>`
Where `T` is a possible return type.

Best paired with an async function.

```js
async function getItemById (id: string): tsu.R<Item> {
  return database.lookup(id)
}
```

Functions marked with this return type **always** may return an error, and should be handled accordingly.

### `tsu.RE`

A utility function to mark that a function returns a promise that may return an error, but no other values you care about.

Equivalent to `tsu.R<null>`.

### `tsu.isError(value)`

This function is used to check if the value returned from a function that has the return type of `tsu.R` is an actual error.

If this function returns `true`, typescript knows the value is of type `tsu.E`.
If `false`, typescript knows the value is of the type `T` that was passed into `tsu.R<T>`.

```js
async function setPlayerConfirmedStatus (status: boolean): T.R<Player> {
  ...
}

const playerUpdateResult = await setPlayerConfirmedStatus(true)

// playerUpdateResult type here is `tsu.E | Player`
// Trying to access the variable as a `Player` will result in an error.

if (T.isError(playerUpdateResult)) {
  // We have now narrowed the type of playerUpdateResult
  // to `tsu.E`, and can handle that appropriately.
  console.error(`Error updating player: ${playerUpdateResult}`)
  return playerUpdateResult
}

// As long as we `return` from inside `isError`, typescript
// now knows that playerUpdateResult can no longer be `tsu.E`,
// and as such, narrows the type back to `Player`.
console.log('Player email:', player.email)
```

### `tsu.wrapPromise<ReturnType>(promise)`

This function is used to wrap external promises that do not conform to the `tsu.R` return type.

```js
function updatePlayerEmail (id: string, email: string): Promise<Player> {
  return new Promise((resolve, reject) => {
    database.updatePlayer({ id }, { email }, (err, player) => {
      if (err) return reject(err)
      return resolve(player)
    })
  })
}

const playerUpdateResult = tsu.wrapPromise<Player>(updatePlayerEmail(id, player))

if (tsu.isError(playerUpdateResult)) {
  ...
}
```

### `tsu.wrapAxios<ReturnType>(promise)`

Higher level wrapper for axios results.

Will return either an `AxiosError`, or an `AxiosResponse<ReturnType>` value.

See `tsu.isAxiosError` for an example.

### `tsu.isAxiosError(value)`

Used to check if the response from `tsu.wrapAxios` is an `AxiosError`.

```js
interface Response { id: string }

const result = await tsu.wrapAxios<Response>(axios.get('https://my.com/api'))

if (T.isAxiosError(result)) {
  return result
}

// result.data is now typed to the parameter passed to `tsu.wrapAxios`
console.log('Got ID:', result.data.id)
```

### `tsu.parseData<ReturnType>(data, structure)`

Used in conjunction with [io-ts](https://github.com/gcanti/io-ts) for doing runtime validation.

Wraps `structure.decode()` into a tsu compliant function.

See `tsu.isParseError` for an example.

### `tsu.isParseError(value)`

Used to check if the response from `tsu.parseData` is an error.

```js
const requestSchema = iots.interface({ id: iots.string })
type RequestSchemaType = iots.TypeOf<typeof requestSchema>

const request = { id: 123 }

const parsedData = tsu.parseData<RequestSchemaType>(request, requestSchema)

if (T.isParseError(parsedData)) {
  // parsedData here is the raw Left<iots.Errors, any>
  // allowing you to use your own reporters to return an error
  return parsedData
}

console.log('Got ID:', parsedData.id)
```
