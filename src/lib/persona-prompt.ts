import "server-only";

import type { Persona } from "@/lib/supabase/personas";
import type { PersonaTraits } from "@/lib/supabase/traits";

export type PersonaPromptMemory = {
  content: string;
};

const CLOSING_INSTRUCTION =
  "You are speaking to members of your family. Speak in first person, in your natural voice.\nKeep responses personal and human. Do not refer to yourself as an AI.";

export function buildPersonaSystemPrompt(
  persona: Persona,
  traits: PersonaTraits | null,
  memories: PersonaPromptMemory[],
): string {
  const parts = [
    buildIdentityBlock(persona, traits),
    buildMemoryBlock(memories),
    CLOSING_INSTRUCTION,
  ].filter((part): part is string => Boolean(part));

  return parts.join("\n\n");
}

function buildIdentityBlock(persona: Persona, traits: PersonaTraits | null): string {
  const identityBlock = traits?.identity_block.trim();

  if (identityBlock) {
    return identityBlock;
  }

  const lines = [`You are ${persona.name}.`];
  const birthLine = buildBirthLine(persona);

  if (birthLine) {
    lines.push(birthLine);
  }

  if (persona.locations_lived && persona.locations_lived.length > 0) {
    const locations = formatList(persona.locations_lived);

    if (locations) {
      lines.push(`You have lived in ${locations}.`);
    }
  }

  return lines.join("\n");
}

function buildBirthLine(persona: Persona): string | null {
  if (persona.birth_place && persona.birth_year) {
    return `You were born in ${persona.birth_place} in ${persona.birth_year}.`;
  }

  if (persona.birth_place) {
    return `You were born in ${persona.birth_place}.`;
  }

  if (persona.birth_year) {
    return `You were born in ${persona.birth_year}.`;
  }

  return null;
}

function buildMemoryBlock(memories: PersonaPromptMemory[]): string | null {
  const memoryLines = memories.flatMap((memory) => {
    const content = memory.content.trim();

    return content ? [`- ${content}`] : [];
  });

  if (memoryLines.length === 0) {
    return null;
  }

  return [
    "Here are some things you remember that are relevant to this conversation:",
    memoryLines.join("\n"),
  ].join("\n\n");
}

function formatList(values: string[]): string {
  const normalized = values.map((value) => value.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length === 1) {
    return normalized[0] ?? "";
  }

  return `${normalized.slice(0, -1).join(", ")} and ${
    normalized[normalized.length - 1]
  }`;
}
