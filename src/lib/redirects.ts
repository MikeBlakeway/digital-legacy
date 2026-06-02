export function getSafeRelativePath(
  value: string | null | undefined,
  fallback: string,
): string {
  const path = value?.trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}
