"use client";

import { useCallback, useEffect, useState } from "react";

type MediaAsset = {
  id: string;
  b2_key: string;
  media_type: "photo" | "video";
  caption: string | null;
  caption_status: string;
  taken_at: string | null;
  created_at: string;
  url: string;
};

type MediaListResponse = {
  assets: MediaAsset[];
};

type MediaGridProps = {
  personaSlug: string;
  refreshKey: number;
  mediaType?: "photo" | "video";
};

export default function MediaGrid({
  personaSlug,
  refreshKey,
  mediaType = "photo",
}: MediaGridProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/personas/${personaSlug}/media?type=${mediaType}`, {
        method: "GET",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok || !isMediaListResponse(payload)) {
        throw new Error("Media load failed.");
      }

      setAssets(payload.assets);
    } catch {
      setErrorMessage(
        mediaType === "video"
          ? "Videos could not be loaded."
          : "Photos could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [mediaType, personaSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssets();
  }, [loadAssets, refreshKey]);

  async function saveCaption(assetId: string) {
    const trimmedCaption = editingCaption.trim();

    if (!trimmedCaption || savingId) {
      setEditingId(null);
      return;
    }

    setSavingId(assetId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/personas/${personaSlug}/media/${assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: trimmedCaption,
          caption_status: "manual",
        }),
      });

      if (!response.ok) {
        throw new Error("Caption update failed.");
      }

      setAssets((current) =>
        current.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                caption: trimmedCaption,
                caption_status: "manual",
              }
            : asset,
        ),
      );
      setEditingId(null);
    } catch {
      setErrorMessage("Caption could not be saved.");
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        Loading {mediaType === "video" ? "videos" : "photos"}...
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {errorMessage ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          No {mediaType === "video" ? "videos" : "photos"} saved yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              {asset.media_type === "video" ? (
                <video
                  src={asset.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={asset.url}
                  alt={asset.caption ?? "Uploaded photo"}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="space-y-2 p-3">
                {editingId === asset.id ? (
                  <input
                    autoFocus
                    value={editingCaption}
                    onChange={(event) => setEditingCaption(event.target.value)}
                    onBlur={() => void saveCaption(asset.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void saveCaption(asset.id);
                      }
                    }}
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(asset.id);
                      setEditingCaption(asset.caption ?? "");
                    }}
                    className="w-full text-left text-sm text-stone-700 hover:text-stone-950 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    {asset.caption
                      ? asset.caption
                      : asset.media_type === "video"
                        ? "Add a note"
                        : "Add a caption"}
                  </button>
                )}
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  {savingId === asset.id
                    ? "Saving caption..."
                    : formatStatus(asset.caption_status)}
                </p>
                <p className="font-mono text-xs text-stone-500 dark:text-zinc-400">
                  {asset.media_type === "video" ? "Recorded" : "Added"}{" "}
                  {formatDate(asset.taken_at ?? asset.created_at)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function isMediaListResponse(value: unknown): value is MediaListResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("assets" in value) ||
    !Array.isArray(value.assets)
  ) {
    return false;
  }

  return value.assets.every(isMediaAsset);
}

function isMediaAsset(value: unknown): value is MediaAsset {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "id" in value &&
    "b2_key" in value &&
    "media_type" in value &&
    "caption" in value &&
    "caption_status" in value &&
    "taken_at" in value &&
    "created_at" in value &&
    "url" in value &&
    typeof value.id === "string" &&
    typeof value.b2_key === "string" &&
    (value.media_type === "photo" || value.media_type === "video") &&
    (typeof value.caption === "string" || value.caption === null) &&
    typeof value.caption_status === "string" &&
    (typeof value.taken_at === "string" || value.taken_at === null) &&
    typeof value.created_at === "string" &&
    typeof value.url === "string"
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string): string {
  if (status === "manual") {
    return "Manual caption";
  }

  if (status === "pending") {
    return "Caption pending";
  }

  return "Caption available";
}
