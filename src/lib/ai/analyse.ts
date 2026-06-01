import "server-only";

import {
  ModalError,
  callRunPodEndpoint,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/ai/client";

export type TraitInferenceResult = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  narrative_agency: number;
  narrative_communion: number;
  narrative_redemption: number;
  dominant_values: string[];
  summary_prose: string;
  identity_block: string;
};

export type EmotionLabel =
  | "warm"
  | "sad"
  | "frustrated"
  | "anxious"
  | "amused"
  | "tender"
  | "indignant"
  | "reflective";

export type EmotionClassifyResult = {
  emotion_label: EmotionLabel;
  intensity: number;
};

type AnalyseTask = "trait_inference" | "emotion_classify";

type AnalyseInput = {
  task: AnalyseTask;
  input: string;
};

const EMOTION_LABELS = new Set<EmotionLabel>([
  "warm",
  "sad",
  "frustrated",
  "anxious",
  "amused",
  "tender",
  "indignant",
  "reflective",
]);

export async function inferTraits(
  corpus: string,
  options: RunPodCallOptions = {},
): Promise<TraitInferenceResult> {
  const result = await callAnalyseEndpoint("trait_inference", corpus, options);

  if (!isTraitInferenceResult(result)) {
    throw new ModalError("Analyse endpoint returned an invalid trait_inference result.", {
      details: result,
    });
  }

  return result;
}

export async function classifyEmotion(
  text: string,
  options: RunPodCallOptions = {},
): Promise<EmotionClassifyResult> {
  const result = await callAnalyseEndpoint("emotion_classify", text, options);

  if (!isEmotionClassifyResult(result)) {
    throw new ModalError("Analyse endpoint returned an invalid emotion_classify result.", {
      details: result,
    });
  }

  return result;
}

async function callAnalyseEndpoint(
  task: AnalyseTask,
  input: string,
  options: RunPodCallOptions,
): Promise<unknown> {
  const output = await callRunPodEndpoint<AnalyseInput, unknown>(
    "analyse",
    { task, input },
    options,
  );

  if (isRecord(output) && output.error === "parse_failed") {
    throw new ModalError("Analyse endpoint failed to parse model JSON output.", {
      details: output,
    });
  }

  if (!isRecord(output) || !("result" in output)) {
    throw new ModalError("Analyse endpoint response was missing result.", {
      details: output,
    });
  }

  return output.result;
}

function isTraitInferenceResult(value: unknown): value is TraitInferenceResult {
  return (
    isRecord(value) &&
    isUnitNumber(value.openness) &&
    isUnitNumber(value.conscientiousness) &&
    isUnitNumber(value.extraversion) &&
    isUnitNumber(value.agreeableness) &&
    isUnitNumber(value.neuroticism) &&
    isUnitNumber(value.narrative_agency) &&
    isUnitNumber(value.narrative_communion) &&
    isUnitNumber(value.narrative_redemption) &&
    Array.isArray(value.dominant_values) &&
    value.dominant_values.every((entry) => typeof entry === "string") &&
    typeof value.summary_prose === "string" &&
    typeof value.identity_block === "string"
  );
}

function isEmotionClassifyResult(value: unknown): value is EmotionClassifyResult {
  return (
    isRecord(value) &&
    isEmotionLabel(value.emotion_label) &&
    isUnitNumber(value.intensity)
  );
}

function isEmotionLabel(value: unknown): value is EmotionLabel {
  return typeof value === "string" && EMOTION_LABELS.has(value as EmotionLabel);
}

function isUnitNumber(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}
