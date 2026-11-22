import { expect, test } from "@playwright/test";
import { generatePuzzle } from "../src/engine/generator";
import { gameReducer, newGame } from "../src/game/state";
import { messages } from "../src/i18n/messages";
import { storageKey } from "../src/storage/progress";
import { closeMenu, enterAnswer, openMenu, saved } from "./helpers";

test("restarts an unfinished legacy puzzle with unique values and removes player identities", async ({
  page,
}) => {
  const puzzle = Array.from({ length: 100 }, (_, index) =>
    generatePuzzle({
      seed: `migration-${index}`,
      theme: "kitchen",
      difficulty: 10,
      engineVersion: 1,
    }),
  ).find((candidate) => new Set(Object.values(candidate.values)).size < candidate.symbols.length)!;
  expect(new Set(Object.values(puzzle.values)).size).toBeLessThan(puzzle.symbols.length);
  const game = gameReducer(newGame(puzzle), { type: "attempt", answer: String(puzzle.values.s0) });
  const legacy = {
    version: 1,
    locale: "en",
    activeId: "selected",
    profiles: [
      {
        id: "other",
        name: "Ada",
        avatar: "🐱",
        locale: "en",
        difficulty: 1,
        completed: 0,
        streak: 0,
        game: null,
      },
      {
        id: "selected",
        name: "נועה",
        avatar: "🦊",
        locale: "he",
        difficulty: 10,
        completed: 4,
        streak: 2,
        game,
      },
    ],
  };
  await page.addInitScript((data) => {
    if (!localStorage.getItem("puzzimori.game.v2"))
      localStorage.setItem("puzzimori.profiles.v1", JSON.stringify(data));
  }, legacy);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("he").findValue })).toBeVisible();
  await expect(page.getByText(messages("he").puzzleRestarted)).toBeVisible();
  const migrated = await saved(page);
  expect(migrated).toMatchObject({
    version: 2,
    locale: "he",
    difficulty: 10,
    completed: 4,
    streak: 2,
  });
  expect(migrated.game!.puzzle).toMatchObject({
    engineVersion: 2,
    theme: "kitchen",
    difficulty: 10,
  });
  expect(migrated.game!.puzzle.id).not.toBe(game.puzzle.id);
  expect(migrated.game!.step).toBe(0);
  expect(migrated.game!.attempts).toBe(0);
  expect(new Set(Object.values(migrated.game!.puzzle.values)).size).toBe(
    migrated.game!.puzzle.symbols.length,
  );
  expect(await page.evaluate(() => localStorage.getItem("puzzimori.profiles.v1"))).toBeNull();
  await openMenu(page, "he");
  await expect(page.getByText("נועה", { exact: true })).toHaveCount(0);
  await expect(page.locator("#menu-dialog button:not([data-tooltip-trigger])")).toHaveCount(4);
  await closeMenu(page, "he");
  const restartedGame = migrated.game;
  await page.reload();
  await expect(page.getByRole("heading", { name: messages("he").findValue })).toBeVisible();
  expect((await saved(page)).game).toEqual(restartedGame);
});

test("plays in memory when local storage is blocked", async ({ page }) => {
  const m = messages("en");
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Blocked storage");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await expect(page.getByText(m.unavailable)).toBeVisible();
  await enterAnswer(page, "en", "999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  await expect(page.locator("#feedback")).toHaveText(m.incorrect);
});

test("recovers from malformed storage and starts playing directly", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{broken"), storageKey);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
  await expect(page.getByText(messages("en").recovered)).toBeVisible();
});

test("serves valid web app manifest for PWA installation", async ({ page, request }) => {
  await page.goto("/");
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");

  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifestJson = await response.json();
  expect(manifestJson.name).toContain("Puzzimori");
  expect(manifestJson.short_name).toBe("Puzzimori");
  expect(manifestJson.display).toBe("standalone");
  expect(manifestJson.icons.length).toBeGreaterThan(0);
});

test("preserves unrelated origin caches and serves the cached page offline", async ({
  page,
  context,
}) => {
  await page.goto("/manifest.webmanifest");
  await page.evaluate(async () => {
    const cache = await caches.open("another-app-v1");
    await cache.put("/another-app-marker", new Response("keep"));
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).includes("another-app-v1")))
    .toBe(true);

  await context.setOffline(true);
  const response = await page.reload();
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Puzzimori/);
});
