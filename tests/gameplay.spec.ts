import { expect, test } from "@playwright/test";
import { messages } from "../src/i18n/messages";
import {
  closeMenu,
  enterAnswer,
  language,
  loadGame,
  openMenu,
  saved,
  solvePuzzle,
} from "./helpers";

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
  await expect(page.locator("#menu-dialog button:not([data-tooltip-trigger])")).toHaveCount(4);
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
