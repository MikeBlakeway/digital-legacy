"use client";

import { useRef, useState } from "react";

import {
  MAX_VIDEO_FILE_BYTES,
  VIDEO_CONTENT_TYPES,
  type VideoContentType,
} from "@/lib/media-upload";

type UploadStatus = "queued" | "uploading" | "registering" | "complete" | "error";

type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  error: string | null;
};

type UploadPreparationResponse = {
  upload_url: string;
  b2_key: string;
};

type VideoUploaderProps = {
  personaSlug: string;
  onUploadComplete?: () => void;
};

export default function VideoUploader({
  personaSlug,
  onUploadComplete,
}: VideoUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) {
      return;
    }

    setGlobalError(null);
    const files = Array.from(selected);
    const validFiles = files.filter((file) => {
      if (!isAcceptedType(file.type)) {
        setGlobalError("Choose an MP4, MOV, WEBM, M4V, or 3GP video.");
        return false;
      }

      if (file.size > MAX_VIDEO_FILE_BYTES) {
        setGlobalError("Each video must be 2GB or smaller.");
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    const newItems = validFiles.map<UploadItem>((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name || "New recording",
      progress: 0,
      status: "queued",
      error: null,
    }));

    setUploadItems((current) => [...newItems, ...current]);
    let completedAny = false;

    for (const [index, file] of validFiles.entries()) {
      const completed = await uploadSingleFile(file, newItems[index].id);
      completedAny = completedAny || completed;
    }

    if (completedAny) {
      onUploadComplete?.();
    }
  }

  async function uploadSingleFile(file: File, itemId: string): Promise<boolean> {
    setItemState(itemId, { status: "uploading", progress: 0, error: null });

    try {
      const preparation = await prepareUpload(file, personaSlug);
      await uploadToB2(preparation.upload_url, file, (progress) => {
        setItemState(itemId, { progress });
      });

      setItemState(itemId, { status: "registering", progress: 100 });

      const registerResponse = await fetch(`/api/personas/${personaSlug}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          b2_key: preparation.b2_key,
          media_type: "video",
          taken_at:
            Number.isFinite(file.lastModified) && file.lastModified > 0
              ? new Date(file.lastModified).toISOString()
              : null,
        }),
      });

      if (!registerResponse.ok) {
        throw new Error("Video could not be saved.");
      }

      setItemState(itemId, { status: "complete", progress: 100, error: null });
      return true;
    } catch {
      setItemState(itemId, {
        status: "error",
        error: "The video could not be uploaded. Please try again.",
      });
      return false;
    }
  }

  function setItemState(itemId: string, patch: Partial<UploadItem>) {
    setUploadItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="grid md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-72 flex-col justify-between bg-[var(--primary)] p-7 text-[var(--primary-fg)] sm:p-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] opacity-60">
              New recording
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-medium leading-tight sm:text-4xl">
              Tell one story, in your own words.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 opacity-75">
              Your phone&apos;s camera will open. When you finish, the recording
              uploads privately to your archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="mt-10 w-full rounded-[var(--radius-sm)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-white/30 sm:w-fit"
          >
            Record a video
          </button>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg4)]">
            Already recorded
          </p>
          <h2 className="mt-4 text-2xl font-medium text-[var(--fg1)]">
            Add videos from your phone
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--fg2)]">
            Choose one or more existing clips. They upload one at a time for a
            more reliable mobile connection.
          </p>
          <button
            type="button"
            onClick={() => libraryInputRef.current?.click()}
            className="mt-7 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--fg1)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] sm:w-fit"
          >
            Choose existing videos
          </button>
          <p className="mt-4 text-xs leading-5 text-[var(--fg4)]">
            MP4, MOV, WEBM, M4V, or 3GP. Up to 2GB per video.
          </p>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="video/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept={VIDEO_CONTENT_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {globalError ? (
        <p
          className="border-t border-[var(--border)] px-7 py-4 text-sm text-[var(--danger)] sm:px-10"
          role="alert"
        >
          {globalError}
        </p>
      ) : null}

      {uploadItems.length > 0 ? (
        <div
          className="border-t border-[var(--border)] px-7 py-5 sm:px-10"
          aria-live="polite"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg4)]">
            Uploads
          </p>
          <ul className="divide-y divide-[var(--border)]">
            {uploadItems.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="min-w-0 truncate text-sm font-medium text-[var(--fg1)]">
                    {item.fileName}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-[var(--fg4)]">
                    {statusLabel(item.status, item.progress)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className={
                      item.status === "error"
                        ? "h-full bg-[var(--danger)] transition-[width] duration-300"
                        : "h-full bg-[var(--success)] transition-[width] duration-300"
                    }
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                {item.error ? (
                  <p className="mt-2 text-xs text-[var(--danger)]">{item.error}</p>
                ) : item.status === "uploading" ? (
                  <p className="mt-2 text-xs text-[var(--fg4)]">
                    Keep this page open until the upload is complete.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function isAcceptedType(value: string): value is VideoContentType {
  return VIDEO_CONTENT_TYPES.some((contentType) => contentType === value);
}

async function prepareUpload(
  file: File,
  personaSlug: string,
): Promise<UploadPreparationResponse> {
  const response = await fetch("/api/upload/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona_slug: personaSlug,
      content_type: file.type,
      content_length: file.size,
    }),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || !isUploadPreparationResponse(payload)) {
    throw new Error("Upload URL preparation failed.");
  }

  return payload;
}

function uploadToB2(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload failed."));
      }
    };
    request.onerror = () => reject(new Error("Upload failed."));

    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", file.type);
    request.send(file);
  });
}

function isUploadPreparationResponse(
  value: unknown,
): value is UploadPreparationResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "upload_url" in value &&
    "b2_key" in value &&
    typeof value.upload_url === "string" &&
    typeof value.b2_key === "string"
  );
}

function statusLabel(status: UploadStatus, progress: number): string {
  switch (status) {
    case "queued":
      return "Waiting";
    case "uploading":
      return `${progress}%`;
    case "registering":
      return "Saving";
    case "complete":
      return "Saved";
    case "error":
      return "Failed";
    default:
      return "Waiting";
  }
}
