"use client";

import { useSyncExternalStore } from "react";

type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "digital-legacy-theme";
const CHANGE_EVENT = "digital-legacy-theme-change";
const THEME_COLORS = {
  light: "#f9f8f6",
  dark: "#18130f",
} as const;
const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyPreference(preference: ThemePreference) {
  const theme = resolveTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  document
    .getElementById("theme-color")
    ?.setAttribute("content", THEME_COLORS[theme]);
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function savePreference(preference: ThemePreference) {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {}

  applyPreference(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export default function ThemeSelector() {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as const,
  );

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4 px-3">
        <div>
          <p className="text-sm font-medium text-fg1">Appearance</p>
          <p className="mt-0.5 text-xs text-fg3">Choose how the app looks.</p>
        </div>
        <div
          className="grid grid-cols-3 rounded-lg bg-surface-2 p-1"
          role="group"
          aria-label="Color theme"
        >
          {OPTIONS.map((option) => {
            const selected = preference === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => savePreference(option.value)}
                className={`min-h-9 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? "bg-surface text-fg1 shadow-sm"
                    : "text-fg3 hover:text-fg1"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
