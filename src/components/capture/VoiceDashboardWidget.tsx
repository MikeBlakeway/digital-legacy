"use client";

import { useState } from "react";

import VoiceRecorder from "@/components/capture/VoiceRecorder";

type VoiceDashboardWidgetProps = {
  personaSlug: string;
};

export default function VoiceDashboardWidget({
  personaSlug,
}: VoiceDashboardWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200"
      >
        {isOpen ? "Close recorder" : "Record voice sample"}
      </button>

      {isOpen ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-900 dark:bg-teal-950/20">
          <VoiceRecorder personaSlug={personaSlug} />
        </div>
      ) : null}
    </div>
  );
}
