"use client";

import { useState } from "react";

import MediaGrid from "@/components/capture/MediaGrid";
import PhotoUploader from "@/components/capture/PhotoUploader";

type MediaCaptureWorkspaceProps = {
  personaSlug: string;
};

export default function MediaCaptureWorkspace({
  personaSlug,
}: MediaCaptureWorkspaceProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <PhotoUploader
        personaSlug={personaSlug}
        onUploadComplete={() => setRefreshKey((current) => current + 1)}
      />
      <MediaGrid personaSlug={personaSlug} refreshKey={refreshKey} />
    </div>
  );
}
