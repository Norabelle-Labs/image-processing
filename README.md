# @norabelle-labs/image-processing

Tiny image processing utilities built on top of `sharp` with a friendly typed API:

- Resize to named sizes (numbers, objects, or tuples)
- Optional smart crop around a hotspot
- Generate an LQIP (low‑quality image placeholder) data URL
- Return consistent metadata (width, height, ratio, format, mimetype, filesize)

The library ships ESM and CJS bundles with TypeScript typings.

## Requirements

- Node.js >= 18 or Bun >= 1.1
- `sharp` native binaries (automatically installed via `npm`, `pnpm`, `yarn`, or `bun`)

## Installation

Using Bun (recommended for tests and development):

```sh
bun add @norabelle-labs/image-processing sharp
```

Using npm:

```sh
npm install @norabelle-labs/image-processing sharp
```

Using pnpm:

```sh
pnpm add @norabelle-labs/image-processing sharp
```

Using yarn:

```sh
yarn add @norabelle-labs/image-processing sharp
```

## Quick start

### ESM

```ts
import processImage, { defaultOptions } from "@norabelle-labs/image-processing";
// or named API
// import { processImage } from "@norabelle-labs/image-processing";

const file = await Bun.file("./fixtures/input.jpg").arrayBuffer();
const result = await processImage(Buffer.from(file), "input.jpg");

console.log(result.metadata);
// {
//   width: 1920,
//   height: 1080,
//   ratio: 1.777...
//   format: 'jpeg',
//   filesize: 1234567,
//   filename: 'input.jpg',
//   mimetype: 'image/jpeg'
// }

console.log(Object.keys(result.sizes)); // [ 'original', 'large', 'medium', 'small', 'thumb' ]
console.log(result.lqip); // data:image/webp;base64,...
```

### CommonJS

```js
const { processImage, defaultOptions } = require("@norabelle-labs/image-processing");

(async () => {
  const fs = require("node:fs/promises");
  const buf = await fs.readFile("./fixtures/input.jpg");
  const out = await processImage(buf, "input.jpg");
  console.log(out.metadata);
})();
```

## API

### processImage(source, filename, options?) => Promise<ProcessedImage<Sizes>>

- `source`: any `sharp` input (Buffer, ArrayBuffer, file path, etc.)
- `filename`: used for `metadata.filename`
- `options`:
  - `format`: a `sharp` output format (e.g. `'webp'`, `'jpeg'`)
  - `sizes`: record of named sizes; values can be:
    - number: max dimension (width for landscape, height for portrait), `fit: "inside"` and no enlargement
    - object: `{ width, height, fit?, hotspot? }`
    - tuple: `[width, height, hotspot?, fit?]`
    - the string `'original'`

Returns `{ sizes, lqip, metadata }` where:

- `sizes`: a map of your size name to `{ data: Buffer, format }` (buffer contains the converted image)
- `lqip`: a `data:image/webp;base64,...` placeholder
- `metadata`: `{ width, height, ratio, format, filesize, filename, mimetype }`

Errors: Throws `ImageProcessingError` with code `INVALID_IMAGE` when the input is unreadable.

### createImageSize(image, size, format, sourceWidth, sourceHeight) => Promise<Buffer>

Low-level helper used by `processImage` that performs optional crop/resize and converts to `format`.

### createLqip(image) => Promise<string>

Creates a small, blurred WebP and returns a `data:` URL string.

### defaultOptions

```ts
export const defaultOptions = {
  format: 'webp',
  sizes: {
    original: 'original',
    large: 1200,
    medium: 600,
    small: 300,
    thumb: 160,
  }
}
```

### Types

The main types are exported from `./types`:

- `ProcessedImage<Sizes>`
- `ImageMetadata`
- `NamedSize`, `NamedSizes`, `NamedSizeOptions`, `NamedSizeArray`
- `ImageProcessingOptions<Sizes>`
- `ImageProcessingError`

## Build and bundle

This repo uses `tsup` to produce ESM, CJS and type declarations into `dist/`.

- Build:

```sh
bun run build
# or: npm run build / pnpm build / yarn build
```

Output files:

- ESM: `dist/index.js`
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`

Package `exports` is configured for both environments and includes types.

## Testing (Bun)

This project uses the Bun test runner. Tests live in `tests/`.

- Run tests:

```sh
bun test
```

- Type-check:

```sh
bun run typecheck
```

## Examples

Resize to explicit dimensions and crop around a hotspot:

```ts
import { processImage } from "@norabelle-labs/image-processing";

const src = await Bun.file("./hero.jpg").arrayBuffer();
const { sizes } = await processImage(Buffer.from(src), "hero.jpg", {
  format: "webp",
  sizes: {
    hero: { width: 1600, height: 900, fit: "cover", hotspot: [1200, 400] },
    thumb: 200,
  },
});

await Bun.write("./public/hero.webp", sizes.hero.data);
```

## License

MIT