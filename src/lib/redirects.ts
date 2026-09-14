export function getSafeRelativePath(
  value: string | null | undefined,
  fallback: string,
): string {
  const path = value?.trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://safe-redirect.invalid");
    const parsed = new URL(path, baseUrl);

    if (parsed.origin !== baseUrl.origin) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
