import { describe, it, expect } from "bun:test";
import { clamp } from "../src/util.ts";

describe("clamp", () => {
  it("clamps values within the given range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
