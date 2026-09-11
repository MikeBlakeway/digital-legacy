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

test("authenticated account can reach the video archive", async ({ page }) => {
  const personaSlug = getPersonaSlug();
  test.skip(!personaSlug, "Set PLAYWRIGHT_TEST_PERSONA_SLUG to test video UI.");

  await page.goto(`/capture/${personaSlug}/videos`);

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: /stories/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record a video" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose existing videos" }),
  ).toBeVisible();
});

test("video archive uploads a phone video directly and registers it", async ({
  page,
}) => {
  const personaSlug = getPersonaSlug();
  test.skip(!personaSlug, "Set PLAYWRIGHT_TEST_PERSONA_SLUG to test video upload.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/upload/media", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        upload_url: "http://127.0.0.1:3001/test-b2-video-upload",
        b2_key: "media/test-persona-id/test-video.mp4",
      }),
    });
  });
  await page.route("**/test-b2-video-upload", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });
  await page.route(`**/api/personas/${personaSlug}/media*`, async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as {
        media_type?: string;
        taken_at?: string | null;
      };
      expect(body.media_type).toBe("video");
      expect(body.taken_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-video-id" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ assets: [] }),
    });
  });

  await page.goto(`/capture/${personaSlug}/videos`);
  const libraryInput = page.locator('input[type="file"]').nth(1);
  await libraryInput.setInputFiles({
    name: "family-story.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("test-video-content"),
  });

  await expect(page.getByText("family-story.mp4")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page.getByText("No videos saved yet.")).toBeVisible();
});

test("authenticated owner can prepare a direct video upload", async ({ request }) => {
  const personaSlug = getPersonaSlug();
  test.skip(!personaSlug, "Set PLAYWRIGHT_TEST_PERSONA_SLUG to test video upload.");

  const response = await request.post("/api/upload/media", {
    data: {
      persona_slug: personaSlug,
      content_type: "video/mp4",
      content_length: 1024,
    },
  });
  const body = (await response.json()) as {
    upload_url?: string;
    b2_key?: string;
  };

  expect(response.status()).toBe(200);
  expect(body.upload_url).toMatch(/^https:/);
  expect(body.b2_key).toMatch(/\.mp4$/);
});
