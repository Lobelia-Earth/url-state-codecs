# Lobelia URL State Codecs

Codecs for encoding arbitrary state trees into URL parameters and back again.

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

## Usage

In the most basic example, you’ll want to create a state codec in your state initialization code:

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

In your state update code, e.g. in a subscriber, add this code to automatically update your URL search parameters without adding an entry to the browser history:

```ts
// Encodes only paramters that have changed from defaultState.
const encodeResult = stateCodec.encodeAs.urlSearchString(currentState);

if (!encodeResult.ok) {
  // ...Handle encoding error...
}

const newUrl = new URL(window.location.href);
newUrl.search = encodeResult.data;
window.history.replaceState(window.history.state, '', newUrl);
```

See [the demo directory](./src/demo) for additional examples written as end-to-end tests that are run as part of this package’s test suite.

## Contributing

- Please keep the level of type safety as high or higher than you found it.
- Please make sure that new code is reasonably covered by tests and that unit tests pass.
- If you need to export any additional modules (e.g. new codecs or wrappers), you will need to modify [esbuild.js](./esbuild.js) and `"exports"` in [package.json](./package.json).
