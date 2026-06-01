import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import DiaryEntryComposer from "@/components/capture/diary/DiaryEntryComposer";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewDiaryEntryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NewDiaryEntryPage({ params }: NewDiaryEntryPageProps) {
  const { slug } = await params;
  const persona = await getOwnedPersona(slug);

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <Link
            href={`/capture/${persona.slug}/diary`}
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Back to diary
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            New diary entry
          </h1>
        </div>

        <DiaryEntryComposer personaSlug={persona.slug} />
      </section>
    </main>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/diary/new`)}`,
    );
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
