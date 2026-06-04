import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  listConversationsForPersonaUser,
  type ConversationListItem,
} from "@/lib/supabase/conversations";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { getCurrentTraits } from "@/lib/supabase/traits";

export const dynamic = "force-dynamic";

type TalkLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TalkLandingPage({ params }: TalkLandingPageProps) {
  const { slug } = await params;
  const access = await getAccessiblePersona(slug);
  const serviceClient = createServiceRoleClient();
  const [traits, recentConversations] = await Promise.all([
    getCurrentTraits(serviceClient, access.persona.id),
    listConversationsForPersonaUser(serviceClient, {
      personaId: access.persona.id,
      userId: access.userId,
      limit: 5,
    }),
  ]);

  return (
    <main className="flex flex-1 bg-purple-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 sm:py-16">
        <Link
          href="/"
          className="text-sm text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-purple-100"
        >
          Home
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <PersonaPortrait name={access.persona.name} />

          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Conversation mode
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
              {access.persona.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700 dark:text-zinc-300">
              {traits?.summary_prose ?? formatBiographicalFallback(access.persona)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/talk/${access.persona.slug}/new`}
                className="rounded-md bg-purple-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-800 dark:bg-purple-300 dark:text-purple-950 dark:hover:bg-purple-200"
              >
                Start a new conversation
              </Link>
              <Link
                href={`/talk/${access.persona.slug}/history`}
                className="rounded-md border border-purple-200 px-5 py-2.5 text-sm font-medium text-purple-800 transition hover:border-purple-400 hover:bg-purple-100 dark:border-purple-900 dark:text-purple-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/40"
              >
                Browse past conversations
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="recent-conversations">
          <div className="flex items-end justify-between gap-4">
            <h2 id="recent-conversations" className="text-lg font-semibold">
              Recent conversations
            </h2>
            {recentConversations.length > 0 ? (
              <Link
                href={`/talk/${access.persona.slug}/history`}
                className="text-sm font-medium text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-purple-100"
              >
                View all
              </Link>
            ) : null}
          </div>

          <ConversationList
            personaSlug={access.persona.slug}
            conversations={recentConversations}
            emptyText="No conversations yet."
          />
        </section>
      </section>
    </main>
  );
}

function PersonaPortrait({ name }: { name: string }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-purple-200 bg-purple-100 shadow-sm dark:border-purple-900 dark:bg-purple-950/40">
      <div className="flex h-full items-center justify-center">
        <span className="text-7xl font-semibold text-purple-900 dark:text-purple-100">
          {name.trim().slice(0, 1).toUpperCase() || "?"}
        </span>
      </div>
    </div>
  );
}

function ConversationList({
  personaSlug,
  conversations,
  emptyText,
}: {
  personaSlug: string;
  conversations: ConversationListItem[];
  emptyText: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-purple-200 bg-white p-6 text-sm text-stone-600 dark:border-purple-900 dark:bg-zinc-900 dark:text-zinc-300">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="divide-y divide-purple-100 overflow-hidden rounded-lg border border-purple-200 bg-white dark:divide-zinc-800 dark:border-purple-900 dark:bg-zinc-900">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/talk/${personaSlug}/${conversation.id}`}
          className="block p-5 transition hover:bg-purple-50 dark:hover:bg-purple-950/30"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-950 dark:text-zinc-50">
                {conversation.first_user_message ?? "Conversation"}
              </h3>
              {conversation.latest_message_preview ? (
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
                  {conversation.latest_message_preview}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-sm text-stone-500 dark:text-zinc-400">
              <span>{formatDate(conversation.updated_at)}</span>
              <span className="mx-2">-</span>
              <span>{conversation.message_count} messages</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function getAccessiblePersona(
  slug: string,
): Promise<{ persona: Persona; userId: string }> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/talk/${slug}`)}`);
  }

  const serviceClient = createServiceRoleClient();
  const persona = await getPersonaBySlug(serviceClient, slug);

  if (!persona) {
    notFound();
  }

  if (persona.owner_user_id === userId) {
    return { persona, userId };
  }

  const accessResult = await serviceClient
    .from("persona_access")
    .select("persona_id")
    .eq("persona_id", persona.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (accessResult.error || !accessResult.data) {
    notFound();
  }

  return { persona, userId };
}

function formatBiographicalFallback(persona: Persona): string {
  const parts = [
    persona.birth_year ? `born in ${persona.birth_year}` : null,
    persona.birth_place ? `from ${persona.birth_place}` : null,
    persona.locations_lived?.length ? persona.locations_lived.join(", ") : null,
  ].filter(Boolean);

  return parts.length > 0
    ? `${persona.name} - ${parts.join(", ")}.`
    : `${persona.name}'s persona is ready for conversation.`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
