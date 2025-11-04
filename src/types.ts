import type { DefaultNamedSizes } from "./defaults.ts";
import type { AvailableFormatInfo, FitEnum, FormatEnum } from "sharp";

export interface ProcessedImage<Sizes extends NamedSizes> {
  sizes: ImageSizes<Sizes>;
  metadata: ImageMetadata;
  lqip: string;
}

export type ImageSizes<Sizes extends NamedSizes> = {
  [Key in keyof Sizes]: {
    data: Buffer<ArrayBufferLike>;
    format: keyof FormatEnum | AvailableFormatInfo;
  };
};

export interface ImageMetadata {
  width: number;
  height: number;
  ratio: number;

  format: string;
  filesize: number;
  filename: string;
  mimetype: string;
}

export type Hotspot = [x: number, y: number];

export interface NamedSizeOptions {
  width: number;
  height: number;
  fit?: keyof FitEnum;
  hotspot?: Hotspot;
}

export type NamedSizeArray = [width: number, height: number, hotspot?: Hotspot, fit?: keyof FitEnum];

export type NamedSize = number | NamedSizeArray | NamedSizeOptions | "original";
export type NamedSizes = Record<string, NamedSize>;

export interface ImageProcessingOptions<Sizes extends NamedSizes = DefaultNamedSizes> {
  format?: keyof FormatEnum | AvailableFormatInfo;
  sizes?: Sizes;
  hotspot?: Hotspot;
}

export class ImageProcessingError extends Error {
  static readonly CODE_INVALID_IMAGE = "INVALID_IMAGE";

  constructor(
    message: string,
    public code: string,
    cause?: Error,
  ) {
    super(message, { cause });
  }
}
