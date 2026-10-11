import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { generatePuzzle } from "../src/engine/generator";
import { newGame } from "../src/game/state";
import { emptyData, storageKey } from "../src/storage/progress";

const sizes = [
  { name: "desktop-1280x800", width: 1280, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
] as const;

test.beforeEach(async ({ page }) => {
  // Reproduce the equations in the reviewed snapshots using the engine's seed contract.
  const puzzle = generatePuzzle({
    seed: "repnix-visual-24",
    theme: "crafting",
    difficulty: 1,
    engineVersion: 2,
  });
  expect(puzzle.values).toEqual({ s0: 4, s1: 1 });
  expect(puzzle.equations.map((equation) => equation.result)).toEqual([12, 6]);
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data: { ...emptyData, game: newGame(puzzle) },
  });
});

test("home page has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#solver-title")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("home page matches the reviewed desktop and mobile layouts", async ({ page }) => {
  test.skip(
    process.platform !== "darwin" && process.env.RUN_VISUAL_REGRESSION !== "1",
    "Reviewed snapshots run in the macOS visual-regression job.",
  );
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/");
    await expect(page.locator("#solver-title")).toBeVisible();
    await expect(page).toHaveScreenshot("home-" + size.name + ".png", {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  }
});
