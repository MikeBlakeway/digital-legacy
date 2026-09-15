import Link from "next/link";
import { redirect } from "next/navigation";

import { getDiaryStats } from "@/lib/supabase/diary";
import {
  listAccessiblePersonas,
  type AccessiblePersona,
} from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { getVoiceSampleOverview } from "@/lib/supabase/voice-samples";

export const dynamic = "force-dynamic";

type PersonaCardViewModel = {
  persona: AccessiblePersona;
  href: string;
  cta: string;
  supportingText: string;
};

export default async function Home() {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect("/login");
  }

  const serviceClient = createServiceRoleClient();
  const personas = await listAccessiblePersonas(serviceClient, userId);

  const cards = await Promise.all(
    personas.map((persona) => buildPersonaCard(serviceClient, persona)),
  );

  return (
    <main className="flex flex-1 bg-bg text-fg1">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Digital Legacy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg2">
            Choose a persona to continue.
          </p>
        </div>

        {cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <PersonaCard key={card.persona.id} card={card} />
            ))}
          </div>
        ) : (
          <EmptyHomeState isAdmin={hasAdminRole(claimsResult.data?.claims)} />
        )}
      </section>
    </main>
  );
}

async function buildPersonaCard(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  persona: AccessiblePersona,
): Promise<PersonaCardViewModel> {
  if (persona.access_mode === "capture") {
    const [diaryStats, voiceOverview] = await Promise.all([
      getDiaryStats(serviceClient, persona.id),
      getVoiceSampleOverview(serviceClient, persona.id),
    ]);

    return {
      persona,
      href: `/capture/${persona.slug}`,
      cta: "Continue building",
      supportingText: `${diaryStats.total_entries} diary entries - ${formatMinutes(
        voiceOverview.total_duration_seconds,
      )} voice captured`,
    };
  }

  return {
    persona,
    href: `/talk/${persona.slug}`,
    cta: `Talk to ${persona.name}`,
    supportingText: formatBiographicalSummary(persona),
  };
}

function PersonaCard({ card }: { card: PersonaCardViewModel }) {
  return (
    <Link
      href={card.href}
      className="rounded-lg border border-border bg-surface p-5 shadow-sm transition hover:border-border-hover hover:bg-surface-2"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xl font-semibold text-fg1">
          {card.persona.name.trim().slice(0, 1).toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-fg3">
            {card.persona.access_mode === "capture" ? "Capture" : "Conversation"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-fg1">
            {card.persona.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-fg2">
            {card.supportingText}
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-fg1">
            {card.cta}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyHomeState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-fg2">
      {isAdmin ? (
        <Link
          href="/admin"
          className="font-medium text-fg1 hover:text-fg2"
        >
          Open admin dashboard
        </Link>
      ) : (
        <Link
          href="/capture/new"
          className="font-medium text-fg1 hover:text-fg2"
        >
          Create your persona
        </Link>
      )}
    </div>
  );
}

function formatBiographicalSummary(persona: AccessiblePersona): string {
  const parts = [
    persona.birth_year ? `Born ${persona.birth_year}` : null,
    persona.birth_place ? persona.birth_place : null,
    persona.locations_lived?.length ? persona.locations_lived.join(", ") : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "Conversation access granted.";
}

function formatMinutes(totalDurationSeconds: number): string {
  const minutes = Math.round((totalDurationSeconds / 60) * 10) / 10;
  return `${minutes} min`;
}

function hasAdminRole(claims: unknown): boolean {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return false;
  }

  const appMetadata = claims.app_metadata;

  return (
    appMetadata.role === "admin" ||
    (Array.isArray(appMetadata.roles) &&
      appMetadata.roles.some((role) => role === "admin"))
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
