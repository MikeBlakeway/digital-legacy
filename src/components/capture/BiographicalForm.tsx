"use client";

import { useState, type KeyboardEvent } from "react";

export type BiographicalFormErrors = {
  birth_year?: string;
  birth_place?: string;
  locations_lived?: string;
};

type BiographicalFormProps = {
  birthYear: string;
  birthPlace: string;
  locationsLived: string[];
  errors?: BiographicalFormErrors;
  disabled?: boolean;
  onBirthYearChange: (value: string) => void;
  onBirthPlaceChange: (value: string) => void;
  onLocationsLivedChange: (value: string[]) => void;
};

export default function BiographicalForm({
  birthYear,
  birthPlace,
  locationsLived,
  errors,
  disabled = false,
  onBirthYearChange,
  onBirthPlaceChange,
  onLocationsLivedChange,
}: BiographicalFormProps) {
  const [pendingLocation, setPendingLocation] = useState("");

  function addLocation() {
    const location = pendingLocation.trim();

    if (!location || locationsLived.includes(location)) {
      setPendingLocation("");
      return;
    }

    onLocationsLivedChange([...locationsLived, location]);
    setPendingLocation("");
  }

  function removeLocation(location: string) {
    onLocationsLivedChange(locationsLived.filter((item) => item !== location));
  }

  function handleLocationKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addLocation();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-950 dark:text-zinc-50">
          Biographical facts
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300">
          This is factual grounding only — it helps the persona speak accurately
          about where they grew up and lived. Your personality comes through in
          your stories.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="birth-year"
            className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
          >
            Birth year
          </label>
          <input
            id="birth-year"
            name="birth_year"
            type="number"
            inputMode="numeric"
            min={1}
            value={birthYear}
            disabled={disabled}
            onChange={(event) => onBirthYearChange(event.target.value)}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
          />
          {errors?.birth_year ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
              {errors.birth_year}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="birth-place"
            className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
          >
            Birthplace
          </label>
          <input
            id="birth-place"
            name="birth_place"
            type="text"
            value={birthPlace}
            disabled={disabled}
            onChange={(event) => onBirthPlaceChange(event.target.value)}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
          />
          {errors?.birth_place ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
              {errors.birth_place}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="locations-lived"
          className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
        >
          Places lived
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="locations-lived"
            type="text"
            value={pendingLocation}
            disabled={disabled}
            onChange={(event) => setPendingLocation(event.target.value)}
            onKeyDown={handleLocationKeyDown}
            className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
          />
          <button
            type="button"
            disabled={disabled || !pendingLocation.trim()}
            onClick={addLocation}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
          >
            Add
          </button>
        </div>

        {locationsLived.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {locationsLived.map((location) => (
              <span
                key={location}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-stone-100 px-3 py-1.5 text-sm text-stone-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {location}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeLocation(location)}
                  aria-label={`Remove ${location}`}
                  className="rounded-sm px-1 text-stone-500 hover:bg-stone-200 hover:text-stone-950 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {errors?.locations_lived ? (
          <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
            {errors.locations_lived}
          </p>
        ) : null}
      </div>
    </div>
  );
}
