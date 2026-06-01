export const INTERVIEW_THEMES = [
  {
    id: "values",
    title: "What I Believe",
    framing: "Probes deeply-held beliefs and principles",
  },
  {
    id: "relationships",
    title: "The People Who Shaped Me",
    framing: "Explores significant relationships",
  },
  {
    id: "fears",
    title: "What I've Carried",
    framing: "Explores fears, regrets, things that weigh on the subject",
  },
  {
    id: "life_stories",
    title: "Stories From My Life",
    framing: "Surfaces narrative-rich episodes from the subject's history",
  },
  {
    id: "formative",
    title: "What Made Me",
    framing: "Childhood, upbringing, formative experiences",
  },
] as const;

export type InterviewTheme = (typeof INTERVIEW_THEMES)[number];
export type InterviewThemeId = InterviewTheme["id"];

export function isInterviewThemeId(value: unknown): value is InterviewThemeId {
  return (
    typeof value === "string" &&
    INTERVIEW_THEMES.some((theme) => theme.id === value)
  );
}

export function getInterviewTheme(themeId: InterviewThemeId): InterviewTheme {
  const theme = INTERVIEW_THEMES.find((candidate) => candidate.id === themeId);

  if (!theme) {
    throw new Error(`Unknown interview theme: ${themeId}`);
  }

  return theme;
}
