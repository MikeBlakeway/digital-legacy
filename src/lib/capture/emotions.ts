export const EMOTION_LABELS = [
  "warm",
  "sad",
  "frustrated",
  "anxious",
  "amused",
  "tender",
  "indignant",
  "reflective",
] as const;

export type EmotionLabel = (typeof EMOTION_LABELS)[number];

export type EmotionOption = {
  label: EmotionLabel;
  display: string;
  emoji: string;
};

export const EMOTION_OPTIONS: EmotionOption[] = [
  { label: "warm", display: "Warm / happy", emoji: "😊" },
  { label: "sad", display: "Sad / heavy", emoji: "😔" },
  { label: "frustrated", display: "Frustrated / angry", emoji: "😠" },
  { label: "anxious", display: "Anxious / worried", emoji: "😰" },
  { label: "amused", display: "Amused / laughing", emoji: "😂" },
  { label: "tender", display: "Tender / loving", emoji: "🥰" },
  { label: "indignant", display: "Indignant / principled", emoji: "😤" },
  { label: "reflective", display: "Calm / reflective", emoji: "😌" },
];

export type EmotionCounts = Record<EmotionLabel, number>;

export function isEmotionLabel(value: unknown): value is EmotionLabel {
  return (
    typeof value === "string" &&
    EMOTION_LABELS.some((label) => label === value)
  );
}

export function createEmptyEmotionCounts(): EmotionCounts {
  return {
    warm: 0,
    sad: 0,
    frustrated: 0,
    anxious: 0,
    amused: 0,
    tender: 0,
    indignant: 0,
    reflective: 0,
  };
}
