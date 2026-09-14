"use client";

import { useEffect, useState } from "react";

const DISMISSED_STORAGE_KEY = "digital-legacy:pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const environmentFrame = window.requestAnimationFrame(() => {
      setIsStandalone(isRunningStandalone());
      setIsIOS(isAppleMobileDevice());
      setIsDismissed(
        window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true",
      );
    });

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallEvent(null);
      setIsStandalone(true);
      window.localStorage.removeItem(DISMISSED_STORAGE_KEY);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(environmentFrame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isStandalone || isDismissed || (!isIOS && !installEvent)) {
    return null;
  }

  async function install() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);

    if (choice.outcome === "dismissed") {
      dismiss();
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setIsDismissed(true);
  }

  return (
    <aside
      aria-label="Install Digital Legacy"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-lg rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-4 text-[var(--fg1)] shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Keep Digital Legacy close</p>
          {isIOS ? (
            <p className="mt-1 text-sm leading-6 text-[var(--fg2)]">
              In Safari, tap Share, then Add to Home Screen. It will open like
              an app from your home screen.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-6 text-[var(--fg2)]">
              Install this private archive on your device for quicker access.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install suggestion"
          className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-[var(--fg3)] hover:bg-[var(--surface-2)] hover:text-[var(--fg1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          ×
        </button>
      </div>
      {!isIOS ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-4 w-full rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          Install app
        </button>
      ) : null}
    </aside>
  );
}

function isRunningStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isAppleMobileDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
