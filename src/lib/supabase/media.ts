import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const MEDIA_COLUMNS =
  "id, persona_id, b2_key, media_type, caption, caption_status, taken_at, uploaded_by, created_at";

export type MediaType = "photo" | "video";
export type CaptionStatus = "pending" | "manual" | "auto" | "complete";

export type MediaAsset = {
  id: string;
  persona_id: string;
  b2_key: string;
  media_type: MediaType;
  caption: string | null;
  caption_status: CaptionStatus;
  taken_at: string | null;
  uploaded_by: string;
  created_at: string;
};

export type CreateMediaAssetData = {
  personaId: string;
  b2Key: string;
  uploadedBy: string;
  mediaType?: MediaType;
  takenAt?: string | null;
};

export type ListMediaAssetsParams = {
  personaId: string;
  mediaType?: MediaType;
};

export type MediaStats = {
  total_photos: number;
  captioned_photos: number;
  total_videos: number;
};

export type UpdateMediaCaptionData = {
  personaId: string;
  mediaId: string;
  caption: string;
  captionStatus: Extract<CaptionStatus, "manual" | "complete" | "auto">;
};

export class MediaDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "MediaDatabaseError";
    this.details = details;
  }
}

export async function createMediaAsset(
  client: SupabaseClient,
  data: CreateMediaAssetData,
): Promise<MediaAsset> {
  const result = await client
    .from("media_assets")
    .insert({
      persona_id: normalizeRequiredText(data.personaId, "personaId"),
      b2_key: normalizeRequiredText(data.b2Key, "b2Key"),
      media_type: data.mediaType ?? "photo",
      caption: null,
      caption_status: "pending",
      taken_at: data.takenAt ?? null,
      uploaded_by: normalizeRequiredText(data.uploadedBy, "uploadedBy"),
    })
    .select(MEDIA_COLUMNS)
    .single();
  const row: unknown = result.data;

  if (result.error) {
    throw new MediaDatabaseError("Failed to create media asset.", result.error);
  }

  return normalizeMediaAsset(row);
}

export async function listMediaAssets(
  client: SupabaseClient,
  params: ListMediaAssetsParams,
): Promise<MediaAsset[]> {
  let query = client
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"));

  if (params.mediaType) {
    query = query.eq("media_type", params.mediaType);
  }

  const result = await query.order("created_at", { ascending: false });
  const rows: unknown = result.data;

  if (result.error) {
    throw new MediaDatabaseError("Failed to list media assets.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new MediaDatabaseError("Supabase returned invalid media assets.", rows);
  }

  return rows.map(normalizeMediaAsset);
}

export async function getMediaStats(
  client: SupabaseClient,
  personaId: string,
): Promise<MediaStats> {
  const result = await client
    .from("media_assets")
    .select("media_type, caption_status")
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"));
  const rows: unknown = result.data;

  if (result.error) {
    throw new MediaDatabaseError("Failed to load media stats.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new MediaDatabaseError("Supabase returned invalid media stats.", rows);
  }

  let captionedPhotos = 0;
  let totalPhotos = 0;
  let totalVideos = 0;

  for (const row of rows) {
    if (
      !isRecord(row) ||
      !isMediaType(row.media_type) ||
      !isCaptionStatus(row.caption_status)
    ) {
      throw new MediaDatabaseError("Supabase returned invalid media stats.", rows);
    }

    if (row.media_type === "video") {
      totalVideos += 1;
    } else {
      totalPhotos += 1;
    }

    if (row.media_type === "photo" && row.caption_status !== "pending") {
      captionedPhotos += 1;
    }
  }

  return {
    total_photos: totalPhotos,
    captioned_photos: captionedPhotos,
    total_videos: totalVideos,
  };
}

export async function updateMediaCaption(
  client: SupabaseClient,
  data: UpdateMediaCaptionData,
): Promise<MediaAsset | null> {
  const caption = normalizeRequiredText(data.caption, "caption");
  const result = await client
    .from("media_assets")
    .update({
      caption,
      caption_status: data.captionStatus,
    })
    .eq("persona_id", normalizeRequiredText(data.personaId, "personaId"))
    .eq("id", normalizeRequiredText(data.mediaId, "mediaId"))
    .select(MEDIA_COLUMNS)
    .maybeSingle();
  const row: unknown = result.data;

  if (result.error) {
    throw new MediaDatabaseError("Failed to update media caption.", result.error);
  }

  if (row === null) {
    return null;
  }

  return normalizeMediaAsset(row);
}

function normalizeMediaAsset(value: unknown): MediaAsset {
  if (!isMediaAsset(value)) {
    throw new MediaDatabaseError("Supabase returned an invalid media asset.", value);
  }

  return value;
}

function isMediaAsset(value: unknown): value is MediaAsset {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    typeof value.b2_key === "string" &&
    isMediaType(value.media_type) &&
    (typeof value.caption === "string" || value.caption === null) &&
    isCaptionStatus(value.caption_status) &&
    (typeof value.taken_at === "string" || value.taken_at === null) &&
    typeof value.uploaded_by === "string" &&
    typeof value.created_at === "string"
  );
}

function isMediaType(value: unknown): value is MediaType {
  return value === "photo" || value === "video";
}

function isCaptionStatus(value: unknown): value is CaptionStatus {
  return (
    value === "pending" ||
    value === "manual" ||
    value === "auto" ||
    value === "complete"
  );
}

function normalizeRequiredText(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${name} must be non-empty.`);
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
