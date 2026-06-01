import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createPersona,
  getPersonaBySlug,
  getPersonasByOwner,
  type Persona,
} from "@/lib/supabase/personas";

async function assertPersonaContracts(supabase: SupabaseClient) {
  const created: Persona = await createPersona(supabase, {
    name: "Mike",
    slug: "mike",
    owner_user_id: "00000000-0000-0000-0000-000000000000",
    birth_year: 1978,
    birth_place: "Manchester, England",
    locations_lived: ["Manchester", "London"],
  });

  const bySlug: Persona | null = await getPersonaBySlug(supabase, created.slug);
  const byOwner: Persona[] = await getPersonasByOwner(
    supabase,
    created.owner_user_id,
  );

  return {
    created,
    bySlug,
    byOwner,
  };
}

void assertPersonaContracts({} as SupabaseClient);
