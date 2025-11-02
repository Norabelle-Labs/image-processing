import { expect, test, describe } from "bun:test";
import sharp from "sharp";
import processImage, { createImageSize, createLqip, defaultOptions } from "../src/index.ts";

async function makeSampleImage(width = 120, height = 80, background: sharp.Color = { r: 255, g: 0, b: 0, alpha: 1 }) {
  // Create a simple solid-color PNG in memory
  const img = sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  }).png();
  const buf = await img.toBuffer();
  return buf;
}

describe("processImage", () => {
  test("returns expected metadata, sizes and lqip using defaults", async () => {
    const src = await makeSampleImage(120, 80);

    const result = await processImage(src, "sample.png");

    // metadata
    expect(result.metadata.width).toBe(120);
    expect(result.metadata.height).toBe(80);
    expect(result.metadata.ratio).toBeCloseTo(120 / 80);
    expect(result.metadata.filename).toBe("sample.png");
    expect(typeof result.metadata.format).toBe("string");
    expect(result.metadata.filesize).toBeGreaterThan(0);
    expect(result.metadata.mimetype.startsWith("image/")).toBeTrue();

    // sizes
    const keys = Object.keys(result.sizes).sort();
    const expected = Object.keys(defaultOptions.sizes).sort();
    expect(keys).toEqual(expected);

    for (const [name, { data }] of Object.entries(result.sizes)) {
      expect(Buffer.isBuffer(data)).toBeTrue();
      expect(data.length).toBeGreaterThan(0);
      // All outputs are in the selected format (default webp)
      const meta = await sharp(data).metadata();
      expect(meta.format).toBe((defaultOptions.format as string).toLowerCase());
    }

    // lqip
    expect(result.lqip.startsWith("data:image/webp;base64,")).toBeTrue();
  });
});

describe("createImageSize", () => {
  test("respects withoutEnlargement and fit=inside for numeric size on landscape", async () => {
    // Original 100x50 (ratio > 1)
    const src = await makeSampleImage(100, 50);
    const image = sharp(src);

    // Request width=200 but withoutEnlargement=true should prevent upscaling
    const out = await createImageSize(image, 200, "webp", 100 / 50);
    const meta = await sharp(out).metadata();

    expect(meta.width).toBeLessThanOrEqual(100);
    expect(meta.height).toBeLessThanOrEqual(50);
  });

  test("resizes to fit inside specific WxH", async () => {
    const src = await makeSampleImage(300, 200); // 3:2 ratio
    const image = sharp(src);

    const out = await createImageSize(image, [120, 120], "webp", 3 / 2);
    const meta = await sharp(out).metadata();

    // It must fit inside 120x120 preserving aspect ratio
    expect(meta.width! <= 120 && meta.height! <= 120).toBeTrue();
  });
});

describe("createLqip", () => {
  test("returns a data URL string", async () => {
    const src = await makeSampleImage(60, 40);
    const image = sharp(src);

    const lqip = await createLqip(image);
    expect(lqip.startsWith("data:image/webp;base64,")).toBeTrue();
    // Some arbitrary minimal length to ensure it's not empty
    expect(lqip.length).toBeGreaterThan(64);
  });
});

describe("error handling", () => {
  test("processImage rejects for invalid input", async () => {
    const invalid = Buffer.from([]); // invalid buffer for sharp
    await expect(processImage(invalid, "broken.png")).rejects.toBeDefined();
  });
});
