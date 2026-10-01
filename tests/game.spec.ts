import { expect, test, type Page } from "@playwright/test";
import type { Locale, SavedData } from "../src/game/state";
import { messages } from "../src/i18n/messages";
import { preferencesKey } from "../src/storage/preferences";
import { storageKey } from "../src/storage/progress";
import { generatePuzzle } from "../src/engine/generator";
import { gameReducer, newGame } from "../src/game/state";

async function saved(page: Page): Promise<SavedData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
}

async function openMenu(page: Page, locale: Locale = "en") {
  await page.getByRole("button", { name: messages(locale).menu, exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: messages(locale).menu, exact: true }),
  ).toBeVisible();
}
async function closeMenu(page: Page, locale: Locale = "en") {
  await page
    .getByRole("dialog", { name: messages(locale).menu, exact: true })
    .getByRole("button", { name: messages(locale).close, exact: true })
    .click();
}
async function language(page: Page, from: Locale, to: Locale) {
  await openMenu(page, from);
  await page.getByRole("button", { name: to === "he" ? "עב" : "EN", exact: true }).click();
  await closeMenu(page, to);
}

async function loadGame(page: Page, locale: Locale = "en", difficulty = 1) {
  const m = messages(locale);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
  if (locale === "he") await language(page, "en", "he");
  if (difficulty === 10) {
    await openMenu(page, locale);
    await page.getByRole("slider", { name: m.difficulty }).press("End");
    await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*10`, "i") }).click();
  }
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await expect.poll(async () => (await saved(page)).game?.puzzle.difficulty).toBe(difficulty);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function enterAnswer(page: Page, locale: Locale, value: string) {
  await page.getByLabel(messages(locale).answer, { exact: true }).focus();
  await page.keyboard.press("Delete");
  await page.keyboard.type(value);
}

async function solvePuzzle(page: Page, locale: Locale) {
  const m = messages(locale);
  const data = await saved(page);
  const { puzzle, step } = data.game!;
  for (const id of puzzle.symbols.slice(step)) {
    await enterAnswer(page, locale, String(puzzle.values[id]));
    await page.getByRole("button", { name: m.check, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: m.completionTitle })).toBeVisible();
}

test("first page loads directly into gameplay without configuring a user or picking a theme", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
  await expect(page.locator("#number-pad")).toBeVisible();
  await expect(page.locator("#profile-title")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages("en").chooseTheme })).toHaveCount(0);
  const data = await saved(page);
  expect(data).not.toHaveProperty("profiles");
  expect(data).not.toHaveProperty("activeId");
  await openMenu(page);
  await expect(page.locator("#menu-dialog button")).toHaveCount(4);
  await closeMenu(page);
  expect(data.game).not.toBeNull();
});

for (const locale of ["en", "he"] as const) {
  for (const difficulty of [1, 10]) {
    test(`completes level ${difficulty} in ${locale} with correct layout and progress`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const m = messages(locale);
      await loadGame(page, locale, difficulty);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
      await expect(page.locator('[dir="ltr"]').first()).toHaveCSS("direction", "ltr");
      await expect(page.locator('[aria-label^="' + m.step + ' 1:"]')).toHaveAttribute("dir", "ltr");
      if (testInfo.project.name === "mobile") {
        const solver = await page.locator("#solver-title").boundingBox();
        const board = await page.locator("#clue-board-title").boundingBox();
        expect(solver!.y).toBeLessThan(board!.y);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (difficulty === 10)
        await page.screenshot({
          path: testInfo.outputPath(`puzzimori-${locale}.png`),
          fullPage: true,
        });
      await enterAnswer(page, locale, "abc");
      await page.getByRole("button", { name: m.check, exact: true }).click();
      await expect(page.locator("#feedback")).toHaveText(m.invalid);
      await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("?");
      await enterAnswer(page, locale, "999");
      await page.getByRole("button", { name: m.check, exact: true }).click();
      await expect(page.locator("#feedback")).toHaveText(m.incorrect);
      await expect(page.getByRole("button", { name: m.hint, exact: true })).toHaveCount(0);
      await solvePuzzle(page, locale);
      await expect.poll(async () => (await saved(page)).completed).toBe(1);
      await page.reload();
      await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
      expect((await saved(page)).completed).toBe(1);
      expect(errors).toEqual([]);
    });
  }
}

test("cancels difficulty replacement and restores focus, then confirms a new puzzle", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await enterAnswer(page, "en", "999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  const original = (await saved(page)).game!;
  await openMenu(page);
  const slider = page.getByRole("slider", { name: m.difficulty });
  await slider.focus();
  await slider.press("ArrowRight");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*2`, "i") }).click();
  await expect(page.getByRole("dialog", { name: m.replaceTitle, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: m.cancel })).toBeFocused();
  await page.getByRole("button", { name: m.cancel }).click();
  await expect(slider).toHaveValue("1");
  await expect(slider).toBeFocused();
  expect((await saved(page)).game).toEqual(original);
  expect((await saved(page)).difficulty).toBe(original.puzzle.difficulty);
  await slider.press("End");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*10`, "i") }).click();
  await page.getByRole("button", { name: m.replaceConfirm }).click();
  await openMenu(page);
  await expect(slider).toHaveValue("10");
  await closeMenu(page);
  await expect.poll(async () => (await saved(page)).game!.puzzle.id).not.toBe(original.puzzle.id);
  expect((await saved(page)).game!.attempts).toBe(0);
});

test("preserves a partially solved puzzle through language change and reload", async ({ page }) => {
  const en = messages("en");
  const he = messages("he");
  await loadGame(page, "en");
  const initial = (await saved(page)).game!;
  await enterAnswer(page, "en", String(initial.puzzle.values.s0));
  await page.getByRole("button", { name: en.check, exact: true }).click();
  await language(page, "en", "he");
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  expect((await saved(page)).game!.step).toBe(1);
  await page.reload();
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  expect((await saved(page)).game!.puzzle.id).toBe(initial.puzzle.id);
  expect((await saved(page)).game!.step).toBe(1);
});

test("migrates the selected legacy puzzle and removes player identities", async ({ page }) => {
  const puzzle = generatePuzzle({
    seed: "migration",
    theme: "kitchen",
    difficulty: 10,
    engineVersion: 1,
  });
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
  await expect
    .poll(() => saved(page))
    .toEqual({ version: 2, locale: "he", difficulty: 10, completed: 4, streak: 2, game });
  expect(await page.evaluate(() => localStorage.getItem("puzzimori.profiles.v1"))).toBeNull();
  await openMenu(page, "he");
  await expect(page.getByText("נועה", { exact: true })).toHaveCount(0);
  await expect(page.locator("#menu-dialog button")).toHaveCount(4);
  await closeMenu(page, "he");
  await page.reload();
  await expect(page.getByRole("heading", { name: messages("he").findValue })).toBeVisible();
  expect((await saved(page)).game).toEqual(game);
});

test("supports keyboard answers, the number pad, and three-success suggestions", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await expect(page.locator("#number-pad")).toBeVisible();
  await page.locator("#number-pad").getByRole("button", { name: "1", exact: true }).click();
  await page.locator("#number-pad").getByRole("button", { name: "2", exact: true }).click();
  await page.locator("#number-pad").getByRole("button", { name: m.erase, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("1");
  await page.locator("#number-pad").getByRole("button", { name: m.erase, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("?");
  const puzzle = (await saved(page)).game!.puzzle;
  const digit = String(puzzle.values.s0);
  await page.locator("#number-pad").getByRole("button", { name: digit, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText(digit);
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await saved(page)).game!.step).toBe(1);
  await solvePuzzle(page, "en");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: m.nextPuzzle }).click();
    await solvePuzzle(page, "en");
  }
  await expect(page.getByText(m.suggestion)).toBeVisible();
  expect((await saved(page)).difficulty).toBe(1);
  await expect(page.getByText(m.levelInMenu)).toBeVisible();
  await openMenu(page);
  await page.getByRole("slider", { name: m.difficulty }).press("ArrowRight");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*2`, "i") }).click();
  await expect.poll(async () => (await saved(page)).game!.puzzle.difficulty).toBe(2);
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

test("previews a slider drag and preserves the unfinished puzzle when selecting a new challenge", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await openMenu(page);
  const slider = page.getByRole("slider", { name: m.difficulty });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 8 });
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue("10");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*10`, "i") }).click();
  await expect.poll(async () => (await saved(page)).game?.puzzle.difficulty).toBe(10);
  await enterAnswer(page, "en", "999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  const original = (await saved(page)).game!;
  await openMenu(page);
  await slider.scrollIntoViewIfNeeded();
  const gameBox = (await slider.boundingBox())!;
  await page.mouse.move(gameBox.x + gameBox.width - 8, gameBox.y + gameBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(gameBox.x + gameBox.width * 0.5, gameBox.y + gameBox.height / 2, {
    steps: 8,
  });
  await expect(page.getByRole("dialog", { name: m.replaceTitle, exact: true })).toHaveCount(0);
  expect((await saved(page)).game).toEqual(original);
  await page.mouse.up();
  await page.getByRole("button", { name: new RegExp(m.startLevel, "i") }).click();
  await expect(page.getByRole("dialog", { name: m.replaceTitle, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(slider).toHaveValue("10");
  await closeMenu(page);
  await page.getByRole("button", { name: m.chooseTheme, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();
  await openMenu(page);
  await slider.press("Home");
  await expect(page.getByRole("dialog", { name: m.replaceTitle, exact: true })).toHaveCount(0);
  await closeMenu(page);
  await page.getByRole("button", { name: m.resume, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await openMenu(page);
  await expect(slider).toHaveValue("10");
  await closeMenu(page);
});

test("uses only a keypad and supports physical digit keys without opening a text input", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await expect(page.locator('input:not([type="range"])')).toHaveCount(0);
  await enterAnswer(page, "en", "12abc34");
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("123");
  await page.keyboard.press("Backspace");
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("12");
  await language(page, "en", "he");
  await expect(page.getByLabel(messages("he").answer, { exact: true })).toHaveText("12");
  await page.keyboard.press("Delete");
  await expect(page.getByLabel(messages("he").answer, { exact: true })).toHaveText("?");
  const puzzle = (await saved(page)).game!.puzzle;
  await page.getByLabel(messages("he").answer, { exact: true }).focus();
  await page.keyboard.type(String(puzzle.values.s0));
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await saved(page)).game!.step).toBe(1);
});

test("keeps secondary controls in Menu and suspends gameplay shortcuts while dialogs are open", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: m.clear, exact: true })).toHaveCount(0);
  const game = (await saved(page)).game!;
  await expect(page.locator("[data-active]")).toHaveCount(game.puzzle.equations.length);
  await enterAnswer(page, "en", "12");
  await openMenu(page);
  await page.keyboard.type("34");
  await page.keyboard.press("Delete");
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("12");
  expect((await saved(page)).game).toEqual(game);
  const menu = page.getByRole("dialog", { name: m.menu, exact: true });
  await menu.getByRole("button", { name: m.close, exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () =>
        document.activeElement?.closest("dialog")?.id ??
        document.activeElement?.closest("dialog")?.getAttribute("aria-labelledby"),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: m.menu, exact: true })).toBeFocused();
  await page.keyboard.type("3");
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("123");
  await page.locator("#number-pad").getByRole("button", { name: "4", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await saved(page)).game!.attempts).toBe(1);
});

test("persists animation preferences and respects reduced motion", async ({ page }) => {
  const m = messages("en");
  await loadGame(page);
  const scenery = page.locator("[data-scenery] > span").first();
  await expect(scenery).not.toHaveCSS("animation-name", "none");
  await openMenu(page);
  await page.getByRole("switch", { name: m.animations }).uncheck();
  await closeMenu(page);
  await expect(scenery).toHaveCSS("animation-name", "none");
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).animations, preferencesKey),
    )
    .toBe(false);
  await page.reload();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await expect(scenery).toHaveCSS("animation-name", "none");
  await openMenu(page);
  await page.getByRole("switch", { name: m.animations }).check();
  await closeMenu(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scenery).toHaveCSS("animation-name", "none");
  await expect(page.locator("[data-companion] span").first()).toHaveCSS("animation-name", "none");
  await solvePuzzle(page, "en");
  await expect(page.locator('[data-reaction="complete"]')).toBeVisible();
});

test("navigates worlds with showcase arrows and neighbor cards, displays preview emojis, and spotlights saved puzzle", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page, "en");
  // Open world select screen via brand button
  await page.getByRole("button", { name: m.chooseTheme, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();

  // Initially shows crafting world (which has an unfinished puzzle from loadGame)
  await expect(page.getByRole("heading", { name: m.themeNames[0]! })).toBeVisible();
  await expect(page.getByRole("button", { name: m.resume, exact: true })).toBeVisible();

  // Click next world arrow to navigate to world 1 (kitchen)
  await page.getByRole("button", { name: m.nextWorld, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.themeNames[1]! })).toBeVisible();
  // Play button shown since world 1 is not the saved puzzle
  await expect(page.getByRole("button", { name: m.play, exact: true })).toBeVisible();

  // Click neighbor card directly to navigate to world 2 (sushi)
  await page.getByRole("button", { name: `${m.play}: ${m.themeNames[2]}` }).click();
  await expect(page.getByRole("heading", { name: m.themeNames[2]! })).toBeVisible({
    timeout: 2000,
  });

  // Verify preview emojis group is visible
  const emojiGroup = page.getByRole("group", { name: m.themeNames[2]! });
  await expect(emojiGroup).toBeVisible();

  // Navigate back to world 0 via previous arrow and resume
  await page.getByRole("button", { name: m.previousWorld, exact: true }).click();
  await page.getByRole("button", { name: m.previousWorld, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.themeNames[0]! })).toBeVisible();
  await expect(page.getByRole("button", { name: m.resume, exact: true })).toBeVisible();
  await page.getByRole("button", { name: m.resume, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
});

for (const locale of ["en", "he"] as const) {
  test(`renders every illustrated world with unique SVG references in ${locale}`, async ({
    page,
  }, testInfo) => {
    const m = messages(locale);
    await loadGame(page, locale);
    await page.getByRole("button", { name: m.chooseTheme, exact: true }).click();
    for (let index = 0; index < m.themeNames.length; index++) {
      await expect(page.getByRole("heading", { name: m.themeNames[index]! })).toBeVisible();
      const cover = page.locator('[data-position="center"] [data-world-art]');
      await expect(cover).toBeVisible();
      const motifs = page.locator("[data-scenery] [data-world-motif]");
      await expect(motifs).toHaveCount(2);
      const contained = await motifs.evaluateAll((nodes) =>
        nodes.every((node) => {
          const bounds = node.getBoundingClientRect();
          const viewport = node.closest("svg")!.getBoundingClientRect();
          return (
            bounds.width > 0 &&
            bounds.height > 0 &&
            bounds.top >= viewport.top &&
            bounds.bottom <= viewport.bottom &&
            bounds.left >= viewport.left &&
            bounds.right <= viewport.right
          );
        }),
      );
      expect(contained).toBe(true);
      const ids = await page
        .locator("svg [id]")
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: testInfo.outputPath(`world-${index}-${locale}.png`) });
      await page
        .getByRole("button", { name: locale === "he" ? m.previousWorld : m.nextWorld, exact: true })
        .click();
    }
    await page.setViewportSize({ width: 740, height: 360 });
    await expect(page.getByRole("button", { name: m.resume, exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`landscape-${locale}.png`) });
  });
}
