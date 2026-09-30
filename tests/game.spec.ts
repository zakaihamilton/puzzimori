import { expect, test, type Page } from "@playwright/test";
import type { Locale, SavedData } from "../src/game/state";
import { messages } from "../src/i18n/messages";
import { preferencesKey } from "../src/storage/preferences";
import { storageKey } from "../src/storage/profiles";

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
  await expect
    .poll(async () => (await saved(page)).profiles[0]!.game?.puzzle.difficulty)
    .toBe(difficulty);
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
  const profile = data.profiles.find((profile) => profile.id === data.activeId)!;
  const { puzzle, step } = profile.game!;
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
  await expect(page.getByRole("heading", { name: messages("en").chooseProfile })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages("en").chooseTheme })).toHaveCount(0);
  const data = await saved(page);
  expect(data.profiles.length).toBe(1);
  expect(data.profiles[0]!.name).toBe(messages("en").player);
  expect(data.profiles[0]!.game).not.toBeNull();
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
      await expect.poll(async () => (await saved(page)).profiles[0]!.completed).toBe(1);
      await page.reload();
      await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
      expect((await saved(page)).profiles[0]!.completed).toBe(1);
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
  const original = (await saved(page)).profiles[0]!.game!;
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
  expect((await saved(page)).profiles[0]!.game).toEqual(original);
  await slider.press("End");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*10`, "i") }).click();
  await page.getByRole("button", { name: m.replaceConfirm }).click();
  await openMenu(page);
  await expect(slider).toHaveValue("10");
  await closeMenu(page);
  await expect
    .poll(async () => (await saved(page)).profiles[0]!.game!.puzzle.id)
    .not.toBe(original.puzzle.id);
  expect((await saved(page)).profiles[0]!.game!.attempts).toBe(0);
});

test("preserves a partially solved puzzle through language change, reload, and profile switching", async ({
  page,
}) => {
  const en = messages("en");
  const he = messages("he");
  await loadGame(page, "en");
  const initial = (await saved(page)).profiles[0]!.game!;
  await enterAnswer(page, "en", String(initial.puzzle.values.s0));
  await page.getByRole("button", { name: en.check, exact: true }).click();
  await language(page, "en", "he");
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  expect((await saved(page)).profiles[0]!.game!.step).toBe(1);
  await page.reload();
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  expect((await saved(page)).profiles[0]!.game!.puzzle.id).toBe(initial.puzzle.id);
  expect((await saved(page)).profiles[0]!.game!.step).toBe(1);
  await openMenu(page, "he");
  await page.getByRole("button", { name: `${he.switchProfile}: מגלה`, exact: true }).click();
  await page.getByRole("button", { name: he.newProfile }).click();
  await page.getByLabel(he.name, { exact: true }).fill("Bea");
  await page.getByRole("button", { name: he.create, exact: true }).click();
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  const data = await saved(page);
  expect(data.profiles[0]!.game!.step).toBe(1);
  expect(data.profiles[1]!.game!.step).toBe(0);
  expect(data.profiles[1]!.completed).toBe(0);
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
  const puzzle = (await saved(page)).profiles[0]!.game!.puzzle;
  const digit = String(puzzle.values.s0);
  await page.locator("#number-pad").getByRole("button", { name: digit, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText(digit);
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await saved(page)).profiles[0]!.game!.step).toBe(1);
  await solvePuzzle(page, "en");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: m.nextPuzzle }).click();
    await solvePuzzle(page, "en");
  }
  await expect(page.getByText(m.suggestion)).toBeVisible();
  expect((await saved(page)).profiles[0]!.difficulty).toBe(1);
  await expect(page.getByText(m.levelInMenu)).toBeVisible();
  await openMenu(page);
  await page.getByRole("slider", { name: m.difficulty }).press("ArrowRight");
  await page.getByRole("button", { name: new RegExp(`${m.startLevel}\\s*2`, "i") }).click();
  await expect.poll(async () => (await saved(page)).profiles[0]!.game!.puzzle.difficulty).toBe(2);
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
  await expect.poll(async () => (await saved(page)).profiles[0]!.game?.puzzle.difficulty).toBe(10);
  await enterAnswer(page, "en", "999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  const original = (await saved(page)).profiles[0]!.game!;
  await openMenu(page);
  await slider.scrollIntoViewIfNeeded();
  const gameBox = (await slider.boundingBox())!;
  await page.mouse.move(gameBox.x + gameBox.width - 8, gameBox.y + gameBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(gameBox.x + gameBox.width * 0.5, gameBox.y + gameBox.height / 2, {
    steps: 8,
  });
  await expect(page.getByRole("dialog", { name: m.replaceTitle, exact: true })).toHaveCount(0);
  expect((await saved(page)).profiles[0]!.game).toEqual(original);
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
  const puzzle = (await saved(page)).profiles[0]!.game!.puzzle;
  await page.getByLabel(messages("he").answer, { exact: true }).focus();
  await page.keyboard.type(String(puzzle.values.s0));
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await saved(page)).profiles[0]!.game!.step).toBe(1);
});

test("keeps secondary controls in Menu and suspends gameplay shortcuts while dialogs are open", async ({
  page,
}) => {
  const m = messages("en");
  await loadGame(page);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: m.clear, exact: true })).toHaveCount(0);
  const game = (await saved(page)).profiles[0]!.game!;
  await expect(page.locator("[data-active]")).toHaveCount(game.puzzle.equations.length);
  await enterAnswer(page, "en", "12");
  await openMenu(page);
  await page.keyboard.type("34");
  await page.keyboard.press("Delete");
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveText("12");
  expect((await saved(page)).profiles[0]!.game).toEqual(game);
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
  await expect.poll(async () => (await saved(page)).profiles[0]!.game!.attempts).toBe(1);
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

test("navigates worlds with showcase arrows and ribbon, displays preview emojis, and spotlights saved puzzle", async ({
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

  // Ribbon has 10 world tabs
  const ribbonTabs = page.getByRole("tab");
  await expect(ribbonTabs).toHaveCount(10);
  await expect(ribbonTabs.first()).toHaveAttribute("aria-selected", "true");

  // Click next world arrow
  await page.getByRole("button", { name: m.nextWorld, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.themeNames[1]! })).toBeVisible();
  await expect(ribbonTabs.nth(1)).toHaveAttribute("aria-selected", "true");
  // Play button shown since world 1 is not the saved puzzle
  await expect(page.getByRole("button", { name: m.play, exact: true })).toBeVisible();

  // Click a world badge directly from the ribbon (e.g. world 4)
  await ribbonTabs.nth(4).click();
  await expect(page.getByRole("heading", { name: m.themeNames[4]! })).toBeVisible();
  await expect(ribbonTabs.nth(4)).toHaveAttribute("aria-selected", "true");

  // Verify preview emojis group is visible
  const emojiGroup = page.getByRole("group", { name: m.themeNames[4]! });
  await expect(emojiGroup).toBeVisible();

  // Navigate back to world 0 via ribbon and resume
  await ribbonTabs.first().click();
  await expect(page.getByRole("button", { name: m.resume, exact: true })).toBeVisible();
  await page.getByRole("button", { name: m.resume, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
});
