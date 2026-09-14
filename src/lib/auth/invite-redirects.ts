import { getSafeRelativePath } from "@/lib/redirects";

const DEFAULT_SETUP_DESTINATION = "/capture";

export function createAccountSetupUrl(
  requestOrigin: string,
  destination: string,
): string {
  const origin = readHttpOrigin(requestOrigin);
  const safeDestination = getSafeRelativePath(
    destination,
    DEFAULT_SETUP_DESTINATION,
  );
  const setupUrl = new URL("/account/setup", origin);
  setupUrl.searchParams.set("next", safeDestination);
  return setupUrl.toString();
}

export function readInviteRedirect(
  value: string | null | undefined,
  requestUrl: string,
): string {
  const requestOrigin = new URL(requestUrl).origin;

  if (!value) {
    return "/account/setup";
  }

  try {
    const redirectUrl = new URL(value, requestOrigin);

    if (redirectUrl.origin !== requestOrigin) {
      return "/account/setup";
    }

    return `${redirectUrl.pathname}${redirectUrl.search}`;
  } catch {
    return "/account/setup";
  }
}

function readHttpOrigin(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invitation origin must use HTTP or HTTPS.");
  }

  return url.origin;
}
