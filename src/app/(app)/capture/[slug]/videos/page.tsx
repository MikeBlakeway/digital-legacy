import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import VideoCaptureWorkspace from "@/components/capture/VideoCaptureWorkspace";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VideosPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function VideosPage({ params }: VideosPageProps) {
  const { slug } = await params;
  const persona = await getOwnedPersona(slug);

  return (
    <main className="flex flex-1 bg-[var(--bg)] text-[var(--fg1)]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-9 px-5 py-10 sm:px-10 sm:py-16">
        <header>
          <Link
            href={`/capture/${persona.slug}`}
            className="text-sm text-[var(--fg3)] transition hover:text-[var(--fg1)]"
          >
            Back to capture dashboard
          </Link>
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg4)]">
            Video archive
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-normal sm:text-4xl">
            {persona.name}&apos;s stories
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--fg2)]">
            Record a story or preserve a video already on your phone. Every
            video stays private to this archive.
          </p>
        </header>

        <VideoCaptureWorkspace personaSlug={persona.slug} />
      </section>
    </main>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/videos`)}`);
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  return persona;
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
