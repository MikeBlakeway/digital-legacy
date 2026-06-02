import { mkdir } from "node:fs/promises";

import { expect, test as setup } from "@playwright/test";

import {
  authStateDirectory,
  authStatePath,
  getPrivateRoutePath,
  getTestAccount,
  hasTestAccount,
} from "./support/test-account";

setup("authenticate test account", async ({ page }) => {
  setup.skip(
    !hasTestAccount(),
    "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to authenticate.",
  );

  const account = getTestAccount();
  const privatePath = getPrivateRoutePath();
  const loginPath = `/login?redirectedFrom=${encodeURIComponent(privatePath)}`;

  await page.goto(loginPath);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });

  await mkdir(authStateDirectory, { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
