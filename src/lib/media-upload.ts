export const PHOTO_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/3gpp",
] as const;

export const MAX_PHOTO_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_FILE_BYTES = 2 * 1024 * 1024 * 1024;

export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];
export type VideoContentType = (typeof VIDEO_CONTENT_TYPES)[number];
export type MediaContentType = PhotoContentType | VideoContentType;
export type UploadMediaType = "photo" | "video";

export function mediaTypeForContentType(
  value: unknown,
): UploadMediaType | null {
  if (PHOTO_CONTENT_TYPES.some((contentType) => contentType === value)) {
    return "photo";
  }

  if (VIDEO_CONTENT_TYPES.some((contentType) => contentType === value)) {
    return "video";
  }

  return null;
}

export function maxFileBytesForMediaType(mediaType: UploadMediaType): number {
  return mediaType === "video"
    ? MAX_VIDEO_FILE_BYTES
    : MAX_PHOTO_FILE_BYTES;
}

export function extensionForContentType(contentType: MediaContentType): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    case "video/x-m4v":
      return "m4v";
    case "video/3gpp":
      return "3gp";
    default:
      return "bin";
  }
}

export function isMediaContentType(
  value: unknown,
): value is MediaContentType {
  return mediaTypeForContentType(value) !== null;
}
