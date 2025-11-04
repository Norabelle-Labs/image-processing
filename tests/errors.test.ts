import { describe, it, expect } from "bun:test";
import { processImage } from "../src/processing.ts";
import { ImageProcessingError } from "../src/types.ts";

describe("errors", () => {
  it("throws ImageProcessingError for invalid input", async () => {
    const invalid = Buffer.from([1, 2, 3, 4, 5]);
    await expect(processImage(invalid, "bad.bin")).rejects.toBeInstanceOf(ImageProcessingError);
  });
});
