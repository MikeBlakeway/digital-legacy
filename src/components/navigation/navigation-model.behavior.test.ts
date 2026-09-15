import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseNavigationPersona,
  createPrimaryNavigation,
  findActivePersona,
  isNavigationItemActive,
  type NavigationPersona,
} from "@/components/navigation/navigation-model";

const ownedPersona: NavigationPersona = {
  id: "owned",
  name: "Alex",
  slug: "alex",
  accessMode: "capture",
};

const sharedPersona: NavigationPersona = {
  id: "shared",
  name: "Mum",
  slug: "mum",
  accessMode: "conversation",
};

test("finds the persona represented by a nested route", () => {
  assert.equal(
    findActivePersona("/talk/mum/history", [ownedPersona, sharedPersona]),
    sharedPersona,
  );
  assert.equal(
    findActivePersona("/capture/alex/diary/new", [ownedPersona, sharedPersona]),
    ownedPersona,
  );
});

test("prefers an owned persona when the current route has no persona", () => {
  assert.equal(
    chooseNavigationPersona("/", [sharedPersona, ownedPersona]),
    ownedPersona,
  );
});

test("builds provider navigation with capture and memories", () => {
  const items = createPrimaryNavigation(ownedPersona);
  assert.deepEqual(
    items.map((item) => item.label),
    ["Home", "Overview", "Capture", "Memories", "More"],
  );
});

test("builds consumer navigation with conversation history", () => {
  const items = createPrimaryNavigation(sharedPersona);
  assert.deepEqual(
    items.map((item) => item.label),
    ["Home", "Persona", "New chat", "History", "More"],
  );
});

test("matches exact and nested destinations without overmatching", () => {
  const items = createPrimaryNavigation(ownedPersona);
  const overview = items[1];
  const memories = items[3];

  assert.equal(isNavigationItemActive("/capture/alex", overview), true);
  assert.equal(isNavigationItemActive("/capture/alex/diary", overview), false);
  assert.equal(isNavigationItemActive("/capture/alex/memories/one", memories), true);
  assert.equal(isNavigationItemActive("/capture/alex/memories-old", memories), false);
});
