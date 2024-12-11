# Lobelia URL State Codecs

Codecs for encoding arbitrary state trees into URL parameters and back again.

https://github.com/user-attachments/assets/873bda90-f52c-40da-8c71-a00a26bdf8cd

## What we mean by “codec”

The word “codec” is a portmanteau of “encoder” and “decoder”. Traditionally, software engineers and computer scientists have used it in the context of data streams, particularly audio and video. We are using it in a broader sense of encoding and decoding discrete JavaScript application states to and from URL parameters. This is a common requirement in web cartography, which is what we do at [Lobelia Earth](https://lobelia.earth). Like many maps on the web, ours often need shareable URLs that include the state of that map, including such parameters as a latitude, longitude, zoom, and projection.

## Design objectives

- Focus on the following core challenges of a URL state codec library:
  - encoding complex objects, omitting values unchanged from their defaults, and compressing them as URL-safe strings
  - type safety
  - robust and helpful error handling
- Avoid tight coupling with any particular state management library, architecture, or reactivity model.
- Avoid bloat by:
  - modularizing the value codecs so they can be imported as needed.
  - minimizing the use of runtime dependencies.
  - versioning build metadata to encourage the above (see [esbuild.metafile.txt](./esbuild.metafile.txt) and [esbuild.metafile.json](./esbuild.metafile.json)).
- Allow developers to build and mix in their own custom value codecs.
- Design an API that results in code that is easy to read and understand.

## Example inputs and outputs

Imagine a basic map application with the following default state:

```ts
const defaultState = {
  center: [0, 0],
  zoom: 0,
  projection: 'EPSG:32662',
};
```

Now imagine the user has made some changes to the application state and it now looks like this:

```ts
const newState = {
  center: [0, -70],
  zoom: 0,
  projection: 'EPSG:16161',
};
```

The `center` and `projection` values have changed from their defaults. URL State Codecs can encode those changes as URL (a.k.a query string) parameters:

```txt
c=0x-70&p=EPSG%253A16161
```

Here we’ve encoded the `center` tuple as an `"x"` delimited string. (The delimiter is configurable.) The `zoom` has not changed so there is no need to encode it. However, when we decode, we will always get a complete application state tree with default values supplied where corresponding URL parameters are omitted.

## Usage

Typically, there is already a file with some state initialization code. In Redux, this might be `store.ts` but the setup is basically the same regardless of what state management library you’re using:

```ts
import { defineState } from '@lobelia-earth/url-state-codecs';
import numberCodec from '@lobelia-earth/url-state-codecs/number';
import stringCodec from '@lobelia-earth/url-state-codecs/string';
import arrayOf from '@lobelia-earth/url-state-codecs/wrappers/arrayOf';

// ...Define defaultState and other state initialization...

const { createStateCodec, root } = defineState(defaultState);

// These are just examples. Your application state and URL parameters
// will be different.
const c = root.connect('center', 'c', arrayOf(numberCodec, 'x', 2));
const z = root.connect('zoom', 'z', numberCodec);
const p = root.connect('projection', 'p', stringCodec);
const stateCodec = createStateCodec([c, z, p]);

// Decodes a complete state using values from defaultState to fill in
// undefined parameters.
const decodeResult = stateCodec.decodeFrom.urlSearchString(
  window.location.search
);

if (!decodeResult.ok) {
  // ...Handle `decodeResult.error`, e.g.: log it and return; log it,
  // show an error in the UI and then return; or just throw it...
}

// ...Merge `decodeResult.data` into your application state...
```

The merging of the decoded state into the current application state should be the only part of the integration that will be specific to the reactivity paradigm of your application. In a Redux context where objects are immutable and updates are made by creating new ones, you will likely need to define a new action that replaces your state (or the part of it that you are encoding) with the decoded state. Merging is simpler in other stores such as Pinia (`store.$patch()`), Vuex (`store.replaceState()`), svelte/store (`writableStore.set()`), and solid-js/stores (`setState()`).

To synchronize updates to your application state with URL parameters, add a subscriber to your store:

```ts
const subscriberCallback = (newState) => {
  // Encodes only parameters that have changed from defaultState.
  const encodeResult = stateCodec.encodeAs.urlSearchString(newState);

  if (!encodeResult.ok) {
    // ...Handle encoding error...
  }

  const newUrl = new URL(window.location.href);
  newUrl.search = encodeResult.data;
  window.history.replaceState(window.history.state, '', newUrl);
};
```

This is just a very basic example. In your case, you may want to additionally encode and decode:

- Values deeply nested in your application state: `root.nested(property)`
- ISO 8601 dates: `@lobelia-earth/url-state-codecs/iso8601Date`
- Booleans: `@lobelia-earth/url-state-codecs/boolean`
- Entire objects as base 64 strings: `@lobelia-earth/url-state-codecs/base64Json`
- `NaN` (since `NaN` is disallowed by the number codec by default): `@lobelia-earth/url-state-codecs/wrappers/withNaN`
- Any of the above as a nullable value:`@lobelia-earth/url-state-codecs/wrappers/nullable`

...and others types of data. See [the demo directory](./src/demo) for more exhaustive examples written as end-to-end tests that are run as part of this package’s test suite.

## Contributing

Please...

- File an issue before opening a PR. If you want to make a significant change, discuss it with designated maintainers first.
- Keep the level of type safety as high or higher than you found it.
- Make sure that new code is reasonably covered by tests and that unit tests pass.
- If you need to export any additional modules (e.g. new codecs or wrappers), modify [esbuild.js](./esbuild.js) and `"exports"` in [package.json](./package.json) accordingly.
