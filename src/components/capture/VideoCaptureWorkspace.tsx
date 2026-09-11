"use client";

import { useState } from "react";

import MediaGrid from "@/components/capture/MediaGrid";
import VideoUploader from "@/components/capture/VideoUploader";

type VideoCaptureWorkspaceProps = {
  personaSlug: string;
};

export default function VideoCaptureWorkspace({
  personaSlug,
}: VideoCaptureWorkspaceProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-10">
      <VideoUploader
        personaSlug={personaSlug}
        onUploadComplete={() => setRefreshKey((current) => current + 1)}
      />
      <MediaGrid
        personaSlug={personaSlug}
        refreshKey={refreshKey}
        mediaType="video"
      />
    </div>
  );
}
