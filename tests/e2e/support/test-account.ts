import { dirname } from "node:path";

export type TestAccount = {
  email: string;
  password: string;
};

export const authStatePath =
  process.env.PLAYWRIGHT_AUTH_STATE_PATH ??
  "tests/e2e/.auth/test-account.json";

export const authStateDirectory = dirname(authStatePath);

export function hasTestAccount(): boolean {
  return Boolean(
    process.env.PLAYWRIGHT_TEST_EMAIL?.trim() && process.env.PLAYWRIGHT_TEST_PASSWORD,
  );
}

export function getTestAccount(): TestAccount {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD before running Playwright UI tests.",
    );
  }

  return { email, password };
}

export function getPrivateRoutePath(): string {
  const path = process.env.PLAYWRIGHT_TEST_PRIVATE_PATH?.trim();

  return path || "/capture/new";
}

export function getPersonaSlug(): string | null {
  const slug = process.env.PLAYWRIGHT_TEST_PERSONA_SLUG?.trim();

  return slug || null;
}
