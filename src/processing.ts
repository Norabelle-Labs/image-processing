import {
  type ProcessedImage,
  type ImageMetadata,
  ImageProcessingError,
  type ImageProcessingOptions,
  type ImageSizes,
  type NamedSizes,
  type NamedSize,
  type Hotspot,
} from "./types.ts";
import { type DefaultNamedSizes, defaultOptions } from "./defaults.ts";
import sharp, {
  type AvailableFormatInfo,
  type FitEnum,
  type FormatEnum,
  type Region,
  type ResizeOptions,
  type Sharp,
  type SharpInput,
} from "sharp";
import { clamp } from "./util.ts";

export async function processImage<Sizes extends NamedSizes = DefaultNamedSizes>(
  source: SharpInput,
  filename: string,
  options: ImageProcessingOptions<Sizes> = defaultOptions as never,
): Promise<ProcessedImage<Sizes>> {
  const image = sharp(source);
  const meta = await image.metadata().catch((error) => {
    throw new ImageProcessingError(
      "Could not determine image dimensions or format.",
      ImageProcessingError.CODE_INVALID_IMAGE,
      error,
    );
  });
  const { format: formatOption = defaultOptions.format, sizes: sizeOption = defaultOptions.sizes, hotspot } = options;

  if (!meta.width || !meta.height || !meta.format)
    throw new ImageProcessingError(
      "Could not determine image dimensions or format.",
      ImageProcessingError.CODE_INVALID_IMAGE,
    );

  const ratio = meta.width / meta.height;
  const lqip = await createLqip(image);

  const sizes: ImageSizes<Sizes> = await Promise.all(
    Object.entries(sizeOption).map(async ([name, size]): Promise<[string, ImageSizes<Sizes>[keyof Sizes]]> => {
      const data = await createImageSize(image, size, formatOption, meta.width!, meta.height!, hotspot);
      return [name, { data, format: formatOption }];
    }),
  ).then(Object.fromEntries);

  const metadata: ImageMetadata = {
    width: meta.width,
    height: meta.height,
    ratio,
    format: meta.format,
    filesize: meta.size!,
    filename,
    mimetype: `image/${meta.format!}`,
  };

  return { sizes, lqip, metadata };
}

export async function createImageSize(
  image: Sharp,
  size: NamedSize,
  format: keyof FormatEnum | AvailableFormatInfo,
  sourceWidth: number,
  sourceHeight: number,
  hotspot?: Hotspot,
) {
  const [resize, extract] = normalizeOptions(size, sourceWidth, sourceHeight, hotspot);
  image = image.toFormat(format);
  if (extract) image = image.extract(extract);
  if (resize) image = image.resize(resize);
  return await image.toBuffer();
}

function normalizeOptions(
  size: NamedSize,
  sourceWidth: number,
  sourceHeight: number,
  hotspot?: Hotspot,
): [resize: ResizeOptions | undefined, extract: Region | undefined] {
  const sourceRatio = sourceWidth / sourceHeight;
  let width: number, height: number, fit: keyof FitEnum | undefined;

  if (size === "original") return [undefined, undefined];
  if (typeof size === "number")
    return [{ withoutEnlargement: true, [sourceRatio > 1 ? "width" : "height"]: size, fit: "inside" }, undefined];

  if (Array.isArray(size)) [width, height, hotspot, fit] = size;
  else ({ width, height, hotspot, fit } = size);

  const resize: ResizeOptions = { withoutEnlargement: true, width, height, fit };
  if (!hotspot) return [resize, undefined];
  return [resize, normalizeExtractOptions(sourceWidth, sourceHeight, width, height, hotspot)];
}

function normalizeExtractOptions(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  hotspot: Hotspot,
): Region | undefined {
  if (!hotspot) return undefined;
  const [x, y] = hotspot;

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  const width = sourceRatio > targetRatio ? Math.round(sourceHeight * targetRatio) : sourceWidth;
  const height = sourceRatio > targetRatio ? sourceHeight : Math.round(sourceWidth / targetRatio);

  const left = clamp(Math.round(x - width / 2), 0, sourceWidth - width);
  const top = clamp(Math.round(y - height / 2), 0, sourceHeight - height);

  return { left, top, width, height };
}

export async function createLqip(image: Sharp) {
  const lqip = await image.toFormat("webp").resize(15).blur(10).toBuffer();
  return `data:image/webp;base64,${Buffer.from(lqip).toString("base64")}`;
}
