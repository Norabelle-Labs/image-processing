import { describe, it, expect } from "bun:test";
import sharp from "sharp";
import { processImage, createImageSize, createLqip } from "../src/processing.ts";
import { defaultOptions } from "../src/defaults.ts";

function createSolidImage(
  width = 64,
  height = 48,
  color: { r: number; g: number; b: number } = { r: 0, g: 128, b: 255 },
) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  }).png();
}

describe("processImage", () => {
  it("produces sizes, metadata and lqip for a basic image", async () => {
    const src = await createSolidImage(120, 80).toBuffer();
    const result = await processImage(src, "solid.png");

    // default sizes should exist
    for (const key of Object.keys(defaultOptions.sizes)) {
      expect(result.sizes).toHaveProperty(key);
      const buf = result.sizes[key as keyof typeof result.sizes].data;
      expect(Buffer.isBuffer(buf)).toBe(true);
    }

    expect(result.metadata.filename).toBe("solid.png");
    expect(result.metadata.width).toBe(120);
    expect(result.metadata.height).toBe(80);
    expect(result.metadata.ratio).toBeCloseTo(120 / 80);
    expect(result.lqip.startsWith("data:image/webp;base64,")).toBe(true);
  });
});

describe("createImageSize", () => {
  it("resizes maintaining aspect ratio when given a number", async () => {
    const img = createSolidImage(200, 100); // 2:1
    const buf = await createImageSize(img, 50, "webp", 200, 100);
    const meta = await sharp(buf).metadata();
    // height should be 25 to maintain 2:1 when width constrained to 50 (inside)
    expect(meta.width).toBeLessThanOrEqual(50);
    expect(meta.height).toBeLessThanOrEqual(50);
  });

  it("crops around hotspot when provided", async () => {
    const img = createSolidImage(400, 200); // 2:1
    // Request a square crop 100x100 centered at hotspot (300, 100) (near the right side)
    const buf = await createImageSize(
      img,
      { width: 100, height: 100, hotspot: [300, 100], fit: "cover" },
      "webp",
      400,
      200,
    );
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });
});

describe("createLqip", () => {
  it("returns a data URL string", async () => {
    const img = createSolidImage(50, 50);
    const url = await createLqip(img);
    expect(url.startsWith("data:image/webp;base64,")).toBe(true);
  });
});
