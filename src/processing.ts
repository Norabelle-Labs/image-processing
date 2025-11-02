import {
  type ImageBase,
  type ImageMetadata,
  ImageProcessingError,
  type ImageProcessingOptions,
  type ImageSizes,
  type NamedSizes,
} from "./types.ts";
import { type DefaultNamedSizes, defaultOptions } from "./defaults.ts";
import sharp, { type AvailableFormatInfo, type FormatEnum, type Sharp, type SharpInput } from "sharp";

export async function processImage<Sizes extends NamedSizes = DefaultNamedSizes>(
  source: SharpInput,
  filename: string,
  options: ImageProcessingOptions<Sizes> = defaultOptions as never,
): Promise<ImageBase<Sizes>> {
  const image = sharp(source);
  const meta = await image.metadata();
  const { format: formatOption = defaultOptions.format, sizes: sizeOption = defaultOptions.sizes } = options;

  if (!meta.width || !meta.height || !meta.format)
    throw new ImageProcessingError("Could not determine image dimensions or format.", ImageProcessingError.CODE_INVALID_IMAGE);

  const ratio = meta.width / meta.height;
  const lqip = await createLqip(image);

  const sizes: ImageSizes<Sizes> = await Promise.all(Object.entries(sizeOption).map(async ([name, size]): Promise<[string, ImageSizes<Sizes>[keyof Sizes]]> => {
    const data = size === "original"
      ? await image.toFormat(formatOption).toBuffer()
      : await createImageSize(image, size, formatOption, ratio);
    return [name, { data, format: formatOption }];
  })).then(Object.fromEntries);

  const metadata: ImageMetadata = {
    width:    meta.width,
    height:   meta.height,
    ratio,
    format:   meta.format,
    filesize: meta.size!,
    filename,
    mimetype: `image/${meta.format!}`,
  };

  return { sizes, lqip, metadata };
}

export async function createImageSize(
  image: Sharp,
  size: number | [width: number, height: number] | "original",
  format: keyof FormatEnum | AvailableFormatInfo,
  ratio: number,
) {
  return await image.toFormat(format).resize(Array.isArray(size) ? {
    withoutEnlargement: true,
    width: size[0],
    height: size[1],
    fit: "inside",
  } : {
    withoutEnlargement: true,
    [ratio > 1 ? "width" : "height"]: size,
    fit: "inside",
  }).toBuffer();
}

export async function createLqip(image: Sharp) {
  const lqip = await image.toFormat("webp").resize(15).blur(10).toBuffer();
  return `data:image/webp;base64,${Buffer.from(lqip).toString("base64")}`;
}