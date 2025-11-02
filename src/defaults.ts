import type { ImageProcessingOptions } from "./types.ts";

export const defaultNamedSizes = {
  original: "original",
  large:     1200,
  medium:     600,
  small:      300,
  thumb:      160,
} as const;

export type DefaultNamedSizes = typeof defaultNamedSizes;

export const defaultOptions: Required<ImageProcessingOptions> = {
  format: "webp",
  sizes: defaultNamedSizes,
}