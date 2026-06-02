import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import TraitInferenceButton from "@/components/capture/TraitInferenceButton";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CaptureDashboardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const CAPTURE_SECTIONS = ["Voice", "Photos"] as const;

export default async function CaptureDashboardPage({
  params,
}: CaptureDashboardPageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}`)}`);
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {persona.name}
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-700 dark:text-zinc-300">
            Your capture dashboard — more coming soon.
          </p>
        </div>

        <nav
          aria-label="Capture sections"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Link
            href={`/capture/${persona.slug}/profile`}
            className="rounded-md border border-stone-200 bg-white px-4 py-4 text-left text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Profile
          </Link>
          <Link
            href={`/capture/${persona.slug}/memories`}
            className="rounded-md border border-stone-200 bg-white px-4 py-4 text-left text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Memories
          </Link>
          <Link
            href={`/capture/${persona.slug}/diary`}
            className="rounded-md border border-stone-200 bg-white px-4 py-4 text-left text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Diary
          </Link>
          <Link
            href={`/capture/${persona.slug}/interview`}
            className="rounded-md border border-stone-200 bg-white px-4 py-4 text-left text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Interviews
          </Link>
          {CAPTURE_SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              disabled
              className="rounded-md border border-stone-200 bg-white px-4 py-4 text-left text-sm font-medium text-stone-400 shadow-sm disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
            >
              {section}
            </button>
          ))}
        </nav>

        <TraitInferenceButton personaSlug={persona.slug} />
      </section>
    </main>
  );
}

function readUserId(claims: unknown): string | null {
  if (!isRecord(claims) || typeof claims.sub !== "string") {
    return null;
  }

  return claims.sub;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
