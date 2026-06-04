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

export const dynamic = "force-dynamic";

type ConversationHistoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ConversationHistoryPage({
  params,
}: ConversationHistoryPageProps) {
  const { slug } = await params;
  const access = await getAccessiblePersona(slug);
  const conversations = await listConversationsForPersonaUser(
    createServiceRoleClient(),
    {
      personaId: access.persona.id,
      userId: access.userId,
    },
  );

  return (
    <main className="flex flex-1 bg-purple-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/talk/${access.persona.slug}`}
              className="text-sm text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-purple-100"
            >
              Back to {access.persona.name}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Conversation history
            </h1>
          </div>
          <Link
            href={`/talk/${access.persona.slug}/new`}
            className="rounded-md bg-purple-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-800 dark:bg-purple-300 dark:text-purple-950 dark:hover:bg-purple-200"
          >
            Start new conversation
          </Link>
        </div>

        <ConversationHistoryList
          personaSlug={access.persona.slug}
          conversations={conversations}
        />
      </section>
    </main>
  );
}

function ConversationHistoryList({
  personaSlug,
  conversations,
}: {
  personaSlug: string;
  conversations: ConversationListItem[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-purple-200 bg-white p-6 text-sm text-stone-600 dark:border-purple-900 dark:bg-zinc-900 dark:text-zinc-300">
        No conversations yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-purple-100 overflow-hidden rounded-lg border border-purple-200 bg-white dark:divide-zinc-800 dark:border-purple-900 dark:bg-zinc-900">
      {conversations.map((conversation) => (
        <div key={conversation.id} className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-950 dark:text-zinc-50">
                {conversation.first_user_message ?? "Conversation"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
                {conversation.latest_message_preview ?? "No messages yet."}
              </p>
              <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">
                {formatDate(conversation.updated_at)} -{" "}
                {conversation.message_count} messages
              </p>
            </div>
            <Link
              href={`/talk/${personaSlug}/${conversation.id}`}
              className="rounded-md border border-purple-200 px-4 py-2 text-center text-sm font-medium text-purple-800 transition hover:border-purple-400 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/40"
            >
              View
            </Link>
          </div>
        </div>
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
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/talk/${slug}/history`)}`,
    );
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
