import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PersonaAccessControls } from "@/app/(app)/capture/[slug]/access/PersonaAccessControls";
import { listPersonaConsumers } from "@/lib/auth/persona-sharing";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PersonaAccessPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PersonaAccessPage({
  params,
}: PersonaAccessPageProps) {
  const { slug } = await params;
  const client = await createClient();
  const claimsResult = await client.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/access`)}`,
    );
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  const consumers = await listPersonaConsumers(client, persona.id);

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10 sm:py-16">
        <header>
          <Link
            href={`/capture/${persona.slug}`}
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Back to {persona.name}
          </Link>
          <p className="mt-6 text-sm font-medium text-teal-700 dark:text-teal-300">
            Persona provider
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Family access
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300">
            Decide who can interact with {persona.name}. Access to every other
            persona remains private.
          </p>
        </header>

        <PersonaAccessControls
          slug={persona.slug}
          personaName={persona.name}
          consumers={consumers}
        />
      </section>
    </main>
  );
}

function readUserId(claims: unknown): string | null {
  if (
    typeof claims !== "object" ||
    claims === null ||
    !("sub" in claims) ||
    typeof claims.sub !== "string"
  ) {
    return null;
  }

  return claims.sub;
}
