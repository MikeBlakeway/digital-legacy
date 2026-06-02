import { expect, test } from "@playwright/test";

import {
  getPersonaSlug,
  getPrivateRoutePath,
  hasTestAccount,
} from "./support/test-account";

test.skip(
  !hasTestAccount(),
  "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run private-route UI tests.",
);

test("authenticated account can reach the private capture UI", async ({ page }) => {
  const privatePath = getPrivateRoutePath();

  await page.goto(privatePath);

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);

  if (privatePath === "/capture/new") {
    await expect(
      page.getByRole("heading", { name: "Create a persona" }),
    ).toBeVisible();
  }
});

test("authenticated subject account reaches persona creation validation", async ({
  request,
}) => {
  const response = await request.post("/api/personas", {
    data: {
      name: "",
      slug: "",
    },
  });
  const body = (await response.json()) as { error?: string };

  expect(response.status()).toBe(400);
  expect(body.error).toBe("invalid_request");
});

test("authenticated account can reach a persona profile page", async ({ page }) => {
  const personaSlug = getPersonaSlug();
  test.skip(!personaSlug, "Set PLAYWRIGHT_TEST_PERSONA_SLUG to test profile UI.");

  await page.goto(`/capture/${personaSlug}/profile`);

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Personality profile" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /openness|conscientiousness|extraversion|agreeableness|neuroticism/i,
  );
});

test("authenticated account can reach a persona memory browser", async ({
  page,
}) => {
  const personaSlug = getPersonaSlug();
  test.skip(!personaSlug, "Set PLAYWRIGHT_TEST_PERSONA_SLUG to test memory UI.");

  await page.goto(`/capture/${personaSlug}/memories`);

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: /memories/i })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search memories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All" })).toBeVisible();
});
