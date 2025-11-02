# @norabelle-labs/image-processing

Small, type-safe image processing helper built on top of `sharp`.

- Generates multiple responsive sizes from an input image
- Produces a base64 LQIP (Low-Quality Image Placeholder)
- Returns rich metadata (dimensions, ratio, format, mimetype, file size)
- Sensible defaults (sizes and output format) but fully customizable
- Written in TypeScript; great DX with strong typings

## Installation

You can use Bun, npm, or pnpm to install. This package expects `sharp` (already listed as a dependency).

### Using Bun
```bash
bun install
# or: bun add @norabelle-labs/image-processing
```

### Using npm
```bash
npm install
# or: npm install @norabelle-labs/image-processing
```

### Using pnpm
```bash
pnpm install
# or: pnpm add @norabelle-labs/image-processing
```

## Quick Start

```ts
import processImage, { defaultOptions } from "@norabelle-labs/image-processing";
import sharp from "sharp";

// Load or create your source image (can be a Buffer, path, etc.)
const src = await sharp({
  create: { width: 1200, height: 800, channels: 3, background: { r: 255, g: 255, b: 255 } },
}).png().toBuffer();

const image = await processImage(src, "hero.png");

console.log(image.metadata);
// {
//   width: 1200,
//   height: 800,
//   ratio: 1.5,
//   format: "png",        // format of the input image
//   filesize: 123456,
//   filename: "hero.png",
//   mimetype: "image/png",
// }

// Access generated sizes (default are: original, large, medium, small, thumb)
const webpLarge = image.sizes.large.data; // Buffer in default output format (webp)

// LQIP data URL for placeholders
const lqipDataUrl = image.lqip; // "data:image/webp;base64,...."
```

## Customizing Output

```ts
import processImage, { defaultOptions } from "@norabelle-labs/image-processing";

const custom = await processImage(src, "avatar.jpg", {
  // Any output format supported by sharp (keyof FormatEnum | AvailableFormatInfo)
  format: "jpeg",
  // Define named sizes. Values can be:
  //  - a single number (max width or max height, depending on aspect ratio)
  //  - a tuple [width, height] (fit inside while preserving aspect)
  //  - the string "original" to keep original dimensions
  sizes: {
    original: "original",
    square: [256, 256],
    tiny: 64,
  },
});

const { sizes, metadata, lqip } = custom;
```

## API

### Default export: `processImage`
```ts
async function processImage<Sizes extends NamedSizes = DefaultNamedSizes>(
  source: SharpInput,
  filename: string,
  options?: ImageProcessingOptions<Sizes>
): Promise<ImageBase<Sizes>>
```
- `source`: Anything accepted by `sharp` (Buffer, path, etc.)
- `filename`: Used for returned metadata
- `options.format`: Output format for generated sizes (default: `"webp"`)
- `options.sizes`: Map of named sizes. Defaults to `defaultNamedSizes`:
  ```ts
  {
    original: "original",
    large: 1200,
    medium: 600,
    small: 300,
    thumb: 160,
  }
  ```

Returns:
- `sizes`: Record of each named size to `{ data: Buffer }` of the processed image (in the selected `format`)
- `metadata`: `{ width, height, ratio, format, filesize, filename, mimetype }`
- `lqip`: Base64 `data:image/webp;base64,...` string

### Named exports
- `defaultOptions`: The resolved default options (`format` and `sizes`).
- `defaultNamedSizes`, `DefaultNamedSizes`: default size names/types.
- `createImageSize(image, size, format, ratio)`: low-level helper used by `processImage`.
- `createLqip(image)`: creates a blurred, small webp data URL.
- All related TS types are exported from `src/types.ts`.

## Running Tests

This project uses Bun's test runner.

### With Bun
```bash
bun test
```

### With npm
Use Bun via `bunx` to run the tests (requires Bun installed):
```bash
bunx --bun bun test
```

### With pnpm
```bash
pnpm dlx --package=bun bun test
```

If you prefer adding scripts in your own project, you can add to `package.json`:
```json
{
  "scripts": {
    "test": "bun test"
  }
}
```

## Requirements
- Node.js (for developing with sharp) and native dependencies required by `sharp` for your platform
- Bun (if you want to run tests or use Bun as the package manager/runtime)

## License
MIT (or your preferred license)
