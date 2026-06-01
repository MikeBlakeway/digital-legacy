"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import BiographicalForm, {
  type BiographicalFormErrors,
} from "@/components/capture/BiographicalForm";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENT_YEAR = new Date().getFullYear();

type FieldErrors = BiographicalFormErrors & {
  name?: string;
  slug?: string;
  body?: string;
};

type PersonaApiError = {
  error: string;
  fields?: Record<string, string>;
};

type CreatedPersonaResponse = {
  slug: string;
};

export default function PersonaForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [locationsLived, setLocationsLived] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(deriveSlug(value));
    }

    clearFieldError("name");
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(deriveSlug(value));
    clearFieldError("slug");
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateIdentityFields(name, slug);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length === 0) {
      setStep(2);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const identityErrors = validateIdentityFields(name, slug);
    const birthYearResult = parseBirthYear(birthYear);
    const nextErrors: FieldErrors = { ...identityErrors };

    if (birthYearResult.error) {
      nextErrors.birth_year = birthYearResult.error;
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          ...(birthYearResult.value === undefined
            ? {}
            : { birth_year: birthYearResult.value }),
          ...(birthPlace.trim() ? { birth_place: birthPlace.trim() } : {}),
          ...(locationsLived.length > 0 ? { locations_lived: locationsLived } : {}),
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 409) {
        setFieldErrors((current) => ({
          ...current,
          slug: "That URL slug is already in use.",
        }));
        return;
      }

      if (!response.ok) {
        const apiError = parseApiError(payload);
        setFieldErrors((current) => ({ ...current, ...apiError.fields }));
        setFormError(readSubmitError(apiError.error));
        return;
      }

      if (!isCreatedPersonaResponse(payload)) {
        setFormError("The persona was created, but the response was incomplete.");
        return;
      }

      router.push(`/capture/${payload.slug}`);
    } catch {
      setFormError("Unable to create the persona right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <div className="mb-8 flex items-center gap-3 text-sm font-medium">
        <span
          className={
            step === 1
              ? "text-stone-950 dark:text-zinc-50"
              : "text-stone-500 dark:text-zinc-400"
          }
        >
          1. Name
        </span>
        <span className="h-px w-8 bg-stone-300 dark:bg-zinc-700" />
        <span
          className={
            step === 2
              ? "text-stone-950 dark:text-zinc-50"
              : "text-stone-500 dark:text-zinc-400"
          }
        >
          2. Facts
        </span>
      </div>

      {step === 1 ? (
        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-950 dark:text-zinc-50">
              Name and URL
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300">
              Used in URLs — cannot be changed later.
            </p>
          </div>

          <div>
            <label
              htmlFor="persona-name"
              className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
            >
              Name
            </label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
            />
            {fieldErrors.name ? (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="persona-slug"
              className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
            >
              Slug
            </label>
            <div className="mt-2 flex rounded-md border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-300">
              <span className="flex shrink-0 items-center border-r border-stone-200 px-3 text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
                /capture/
              </span>
              <input
                id="persona-slug"
                type="text"
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                className="min-w-0 flex-1 rounded-r-md bg-transparent px-3 py-2 text-base text-stone-950 outline-none dark:text-zinc-50"
              />
            </div>
            {fieldErrors.slug ? (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                {fieldErrors.slug}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              Continue
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <BiographicalForm
            birthYear={birthYear}
            birthPlace={birthPlace}
            locationsLived={locationsLived}
            errors={fieldErrors}
            disabled={isSubmitting}
            onBirthYearChange={(value) => {
              setBirthYear(value);
              clearFieldError("birth_year");
            }}
            onBirthPlaceChange={(value) => {
              setBirthPlace(value);
              clearFieldError("birth_place");
            }}
            onLocationsLivedChange={(value) => {
              setLocationsLived(value);
              clearFieldError("locations_lived");
            }}
          />

          {formError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(1)}
              className="rounded-md border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
            >
              {isSubmitting ? "Creating..." : "Create persona"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function deriveSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateIdentityFields(name: string, slug: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedName = name.trim();
  const normalizedSlug = slug.trim();

  if (!normalizedName) {
    errors.name = "Name is required.";
  }

  if (!isValidSlug(normalizedSlug)) {
    errors.slug =
      "Slug must be 3-40 characters using lowercase letters, numbers, and hyphens.";
  }

  return errors;
}

function parseBirthYear(value: string): { value?: number; error?: string } {
  const normalized = value.trim();

  if (!normalized) {
    return {};
  }

  const year = Number(normalized);

  if (!Number.isInteger(year) || year < 1 || year > CURRENT_YEAR) {
    return { error: `Birth year must be between 1 and ${CURRENT_YEAR}.` };
  }

  return { value: year };
}

function parseApiError(payload: unknown): PersonaApiError {
  if (!isRecord(payload) || typeof payload.error !== "string") {
    return { error: "create_failed" };
  }

  return {
    error: payload.error,
    fields: isStringRecord(payload.fields) ? payload.fields : undefined,
  };
}

function readSubmitError(error: string): string {
  if (error === "unauthorized") {
    return "Sign in before creating a persona.";
  }

  if (error === "forbidden") {
    return "This account cannot create personas.";
  }

  if (error === "invalid_request") {
    return "Check the highlighted fields and try again.";
  }

  return "Unable to create the persona right now.";
}

function isCreatedPersonaResponse(value: unknown): value is CreatedPersonaResponse {
  return isRecord(value) && typeof value.slug === "string";
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && SLUG_PATTERN.test(slug);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
