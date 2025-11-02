import type { DefaultNamedSizes } from "./defaults.ts";
import type { AvailableFormatInfo, FormatEnum } from "sharp";

export interface ImageBase<Sizes extends NamedSizes> {
  sizes:    ImageSizes<Sizes>;
  metadata: ImageMetadata;
  lqip:     string;
}

export type ImageSizes<Sizes extends NamedSizes> = {
  [Key in keyof Sizes]: { data: Buffer<ArrayBufferLike>; format: keyof FormatEnum | AvailableFormatInfo };
};

export interface ImageMetadata {
  width:    number;
  height:   number;
  ratio:    number;

  format:   string;
  filesize: number;
  filename: string;
  mimetype: string;
}

export type NamedSizes = Record<string, number | [width: number, height: number] | "original">;

export interface ImageProcessingOptions<Sizes extends NamedSizes = DefaultNamedSizes> {
  format?:  keyof FormatEnum | AvailableFormatInfo;
  sizes?:   Sizes;
}

export class ImageProcessingError extends Error {
  static readonly CODE_INVALID_IMAGE = "INVALID_IMAGE";

  constructor(message: string, public code: string, cause?: Error) {
    super(message, { cause });
  }
}
