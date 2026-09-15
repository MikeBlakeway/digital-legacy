import type { ReactNode } from "react";

import AppShell from "@/components/navigation/AppShell";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { listAccessiblePersonas } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  const userId = readStringClaim(claims, "sub");

  if (claimsResult.error || !userId) {
    return (
      <>
        {children}
        <PwaInstallPrompt />
      </>
    );
  }

  const personas = await listAccessiblePersonas(createServiceRoleClient(), userId);

  return (
    <>
      <AppShell
        personas={personas.map((persona) => ({
          id: persona.id,
          name: persona.name,
          slug: persona.slug,
          accessMode: persona.access_mode,
        }))}
        isAdmin={hasRole(claims, "admin")}
        canCreatePersona={hasRole(claims, "subject") || hasRole(claims, "admin")}
      >
        {children}
      </AppShell>
      <PwaInstallPrompt />
    </>
  );
}

function hasRole(claims: unknown, role: string): boolean {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return false;
  }

  const metadata = claims.app_metadata;
  return (
    metadata.role === role ||
    (Array.isArray(metadata.roles) && metadata.roles.includes(role))
  );
}

function readStringClaim(claims: unknown, key: string): string | null {
  if (!isRecord(claims) || typeof claims[key] !== "string") {
    return null;
  }

  return claims[key];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
