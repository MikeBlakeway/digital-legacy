import assert from "node:assert/strict";

import {
  extensionForContentType,
  MAX_PHOTO_FILE_BYTES,
  MAX_VIDEO_FILE_BYTES,
  maxFileBytesForMediaType,
  mediaTypeForContentType,
} from "@/lib/media-upload";

assert.equal(mediaTypeForContentType("image/heic"), "photo");
assert.equal(mediaTypeForContentType("video/quicktime"), "video");
assert.equal(mediaTypeForContentType("application/octet-stream"), null);
assert.equal(extensionForContentType("video/quicktime"), "mov");
assert.equal(extensionForContentType("video/mp4"), "mp4");
assert.equal(maxFileBytesForMediaType("photo"), MAX_PHOTO_FILE_BYTES);
assert.equal(maxFileBytesForMediaType("video"), MAX_VIDEO_FILE_BYTES);
