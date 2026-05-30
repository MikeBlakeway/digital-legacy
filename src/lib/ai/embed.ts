import "server-only";

import {
  ModalError,
  callRunPodEndpoint,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/ai/client";

export const EMBEDDING_DIMENSIONS = 768;

export type EmbeddingVector = number[];

export interface EmbedInput {
  texts: string[];
}

export interface EmbedOutput {
  embeddings: EmbeddingVector[];
}

export async function embedTexts(
  texts: string[],
  options: RunPodCallOptions = {},
): Promise<EmbeddingVector[]> {
  if (texts.length === 0) {
    return [];
  }

  const output = await callRunPodEndpoint<EmbedInput, unknown>(
    "embed",
    { texts },
    options,
  );

  if (!isRecord(output) || !isEmbeddingMatrix(output.embeddings)) {
    throw new ModalError("Embed endpoint returned an invalid output payload.", {
      details: output,
    });
  }

  if (output.embeddings.length !== texts.length) {
    throw new ModalError("Embed endpoint returned a mismatched embedding count.", {
      details: output,
    });
  }

  return output.embeddings;
}

export async function embedText(
  text: string,
  options: RunPodCallOptions = {},
): Promise<EmbeddingVector> {
  const [embedding] = await embedTexts([text], options);

  if (!embedding) {
    throw new ModalError("Embed endpoint did not return an embedding.", {
      details: { text },
    });
  }

  return embedding;
}

function isEmbeddingMatrix(value: unknown): value is EmbeddingVector[] {
  return (
    Array.isArray(value) &&
    value.every(
      (embedding) =>
        Array.isArray(embedding) &&
        embedding.length === EMBEDDING_DIMENSIONS &&
        embedding.every((component) => typeof component === "number"),
    )
  );
}
