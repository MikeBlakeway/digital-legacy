"use client";

import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

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

type PhotoUploaderProps = {
  personaSlug: string;
  onUploadComplete?: () => void;
};

export default function PhotoUploader({
  personaSlug,
  onUploadComplete,
}: PhotoUploaderProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) {
      return;
    }

    setGlobalError(null);
    const files = Array.from(selected);

    const validFiles = files.filter((file) => {
      if (!isAcceptedType(file.type)) {
        setGlobalError("Only JPEG, PNG, WEBP, and HEIC files are supported.");
        return false;
      }

      if (file.size > MAX_FILE_BYTES) {
        setGlobalError("Each file must be 20MB or smaller.");
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    const newItems = validFiles.map<UploadItem>((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      progress: 0,
      status: "queued",
      error: null,
    }));

    setUploadItems((current) => [...newItems, ...current]);

    const results = await Promise.allSettled(
      validFiles.map((file, index) => uploadSingleFile(file, newItems[index].id)),
    );

    if (results.some((result) => result.status === "fulfilled")) {
      onUploadComplete?.();
    }
  }

  async function uploadSingleFile(file: File, itemId: string) {
    setItemState(itemId, { status: "uploading", progress: 0, error: null });

    try {
      const preparation = await prepareUpload(file, personaSlug);
      await uploadToB2(preparation.upload_url, file, (progress) => {
        setItemState(itemId, { progress });
      });

      setItemState(itemId, { status: "registering", progress: 100 });

      const registerResponse = await fetch(`/api/personas/${personaSlug}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          b2_key: preparation.b2_key,
          media_type: "photo",
        }),
      });

      if (!registerResponse.ok) {
        throw new Error("Media asset could not be created.");
      }

      setItemState(itemId, { status: "complete", progress: 100, error: null });
    } catch {
      setItemState(itemId, {
        status: "error",
        error: "Upload failed.",
      });
    }
  }

  function setItemState(itemId: string, patch: Partial<UploadItem>) {
    setUploadItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFiles(event.dataTransfer.files);
  }

  return (
    <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={
          isDragging
            ? "rounded-md border-2 border-dashed border-stone-600 bg-stone-100 p-8 text-center dark:border-zinc-300 dark:bg-zinc-800"
            : "rounded-md border-2 border-dashed border-stone-300 p-8 text-center dark:border-zinc-700"
        }
      >
        <p className="text-sm text-stone-700 dark:text-zinc-200">
          Drag photos here or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
        >
          Choose files
        </button>
        <p className="mt-3 text-xs text-stone-500 dark:text-zinc-400">
          JPEG, PNG, WEBP, HEIC up to 20MB each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {globalError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {globalError}
        </p>
      ) : null}

      {uploadItems.length > 0 ? (
        <ul className="space-y-2">
          {uploadItems.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-stone-200 p-3 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-stone-800 dark:text-zinc-100">
                  {item.fileName}
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400">
                  {statusLabel(item.status)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-stone-200 dark:bg-zinc-700">
                <div
                  className={
                    item.status === "error"
                      ? "h-full bg-red-500"
                      : "h-full bg-stone-900 dark:bg-zinc-100"
                  }
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              {item.error ? (
                <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                  {item.error}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function isAcceptedType(value: string): value is (typeof ACCEPTED_TYPES)[number] {
  return ACCEPTED_TYPES.some((contentType) => contentType === value);
}

async function prepareUpload(
  file: File,
  personaSlug: string,
): Promise<UploadPreparationResponse> {
  const response = await fetch("/api/upload/media", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

    request.onerror = () => {
      reject(new Error("Upload failed."));
    };

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

function statusLabel(status: UploadStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "registering":
      return "Saving";
    case "complete":
      return "Done";
    case "error":
      return "Failed";
    default:
      return "Queued";
  }
}
