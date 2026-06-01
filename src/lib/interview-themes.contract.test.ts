import {
  INTERVIEW_THEMES,
  getInterviewTheme,
  isInterviewThemeId,
  type InterviewTheme,
  type InterviewThemeId,
} from "@/lib/interview-themes";

const themeIds: InterviewThemeId[] = [
  "values",
  "relationships",
  "fears",
  "life_stories",
  "formative",
];

if (INTERVIEW_THEMES.length !== 5) {
  throw new Error("Interview theme contract changed unexpectedly.");
}

for (const themeId of themeIds) {
  const theme: InterviewTheme = getInterviewTheme(themeId);

  if (!isInterviewThemeId(theme.id)) {
    throw new Error("Interview theme ID contract changed unexpectedly.");
  }
}
