import { expect, test, type Page } from "@playwright/test";
import type { Locale, SavedData } from "../src/game/state";
import { messages } from "../src/i18n/messages";
import { storageKey } from "../src/storage/profiles";

async function saved(page: Page): Promise<SavedData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
}

async function createExplorer(page: Page, locale: Locale = "en", name = "Mori") {
  const m = messages(locale);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: messages("en").chooseProfile })).toBeVisible();
  if (locale === "he") await page.getByRole("button", { name: "עב", exact: true }).click();
  await page.getByLabel(m.name, { exact: true }).fill(name);
  await page.getByRole("button", { name: m.create, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function startPuzzle(page: Page, locale: Locale, difficulty = 1) {
  const m = messages(locale);
  if (difficulty === 10) await page.getByRole("slider", { name: m.difficulty }).press("End");
  await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();
  await page.getByRole("button", { name: `${m.play}: ${m.themeNames[0]}`, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await expect
    .poll(async () => (await saved(page)).profiles[0]!.game?.puzzle.difficulty)
    .toBe(difficulty);
}

async function solvePuzzle(page: Page, locale: Locale) {
  const m = messages(locale);
  const data = await saved(page);
  const profile = data.profiles.find((profile) => profile.id === data.activeId)!;
  const { puzzle, step } = profile.game!;
  for (const id of puzzle.symbols.slice(step)) {
    await page.getByLabel(m.answer, { exact: true }).fill(String(puzzle.values[id]));
    await page.getByRole("button", { name: m.check, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: m.completionTitle })).toBeVisible();
}

for (const locale of ["en", "he"] as const) {
  for (const difficulty of [1, 10]) {
    test(`completes level ${difficulty} in ${locale} with correct layout and progress`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const m = messages(locale);
      await createExplorer(page, locale);
      await startPuzzle(page, locale, difficulty);
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
      await page.getByLabel(m.answer, { exact: true }).fill("abc");
      await page.getByRole("button", { name: m.check, exact: true }).click();
      await expect(page.locator("#feedback")).toHaveText(m.invalid);
      await expect(page.getByLabel(m.answer, { exact: true })).toHaveValue("abc");
      await page.getByLabel(m.answer, { exact: true }).fill("999");
      await page.getByRole("button", { name: m.check, exact: true }).click();
      await expect(page.locator("#feedback")).toHaveText(m.incorrect);
      await expect(page.getByLabel(m.answer, { exact: true })).toHaveValue("999");
      await page.getByRole("button", { name: m.hint, exact: true }).click();
      await expect(page.getByText(m.hintEquation, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: m.moreHint, exact: true }).click();
      await page.getByRole("button", { name: m.moreHint, exact: true }).click();
      await expect(page.getByRole("button", { name: m.allHints })).toBeDisabled();
      await solvePuzzle(page, locale);
      await expect.poll(async () => (await saved(page)).profiles[0]!.completed).toBe(1);
      await page.reload();
      await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();
      expect((await saved(page)).profiles[0]!.completed).toBe(1);
      expect(errors).toEqual([]);
    });
  }
}

test("cancels difficulty replacement and restores focus, then confirms a new puzzle", async ({
  page,
}) => {
  const m = messages("en");
  await createExplorer(page);
  await startPuzzle(page, "en");
  await page.getByLabel(m.answer, { exact: true }).fill("999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  const original = (await saved(page)).profiles[0]!.game!;
  const slider = page.getByRole("slider", { name: m.difficulty });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: m.cancel })).toBeFocused();
  await page.getByRole("button", { name: m.cancel }).click();
  await expect(slider).toHaveValue("1");
  await expect(slider).toBeFocused();
  expect((await saved(page)).profiles[0]!.game).toEqual(original);
  await slider.press("End");
  await page.getByRole("button", { name: m.replaceConfirm }).click();
  await expect(slider).toHaveValue("10");
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
  await createExplorer(page, "en", "Ada");
  await startPuzzle(page, "en");
  const initial = (await saved(page)).profiles[0]!.game!;
  await page.getByLabel(en.answer, { exact: true }).fill(String(initial.puzzle.values.s0));
  await page.getByRole("button", { name: en.check, exact: true }).click();
  await page.getByRole("button", { name: "עב", exact: true }).click();
  await expect(page.getByRole("heading", { name: he.findValue })).toBeVisible();
  expect((await saved(page)).profiles[0]!.game!.step).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: he.resume, exact: true }).click();
  expect((await saved(page)).profiles[0]!.game!.puzzle.id).toBe(initial.puzzle.id);
  await page.getByRole("button", { name: `${he.switchProfile}: Ada`, exact: true }).click();
  await page.getByLabel(he.name, { exact: true }).fill("Bea");
  await page.getByRole("button", { name: he.create, exact: true }).click();
  await page.getByRole("button", { name: `${he.play}: ${he.themeNames[1]}`, exact: true }).click();
  const data = await saved(page);
  expect(data.profiles[0]!.game!.step).toBe(1);
  expect(data.profiles[1]!.game!.step).toBe(0);
  expect(data.profiles[1]!.completed).toBe(0);
});

test("supports keyboard answers, the number pad, and three-success suggestions", async ({
  page,
}) => {
  const m = messages("en");
  await createExplorer(page);
  await startPuzzle(page, "en");
  await page.getByRole("button", { name: m.keypad }).click();
  await page.locator("#number-pad").getByRole("button", { name: "1", exact: true }).click();
  await page.locator("#number-pad").getByRole("button", { name: "2", exact: true }).click();
  await page.locator("#number-pad").getByRole("button", { name: m.erase, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveValue("1");
  await page.locator("#number-pad").getByRole("button", { name: m.clear, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveValue("");
  const puzzle = (await saved(page)).profiles[0]!.game!.puzzle;
  const digit = String(puzzle.values.s0);
  await page.locator("#number-pad").getByRole("button", { name: digit, exact: true }).click();
  await expect(page.getByLabel(m.answer, { exact: true })).toHaveValue(digit);
  await page.getByLabel(m.answer, { exact: true }).press("Enter");
  await expect.poll(async () => (await saved(page)).profiles[0]!.game!.step).toBe(1);
  await solvePuzzle(page, "en");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: m.nextPuzzle }).click();
    await solvePuzzle(page, "en");
  }
  await expect(page.getByText(m.suggestion)).toBeVisible();
  expect((await saved(page)).profiles[0]!.difficulty).toBe(1);
  await page.getByRole("button", { name: m.tryNextLevel }).click();
  await expect(page.getByRole("slider", { name: m.difficulty })).toHaveValue("2");
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
  await createExplorer(page);
  await expect(page.getByText(m.unavailable)).toBeVisible();
  await page.getByRole("button", { name: `${m.play}: ${m.themeNames[0]}`, exact: true }).click();
  await expect(page.getByRole("heading", { name: m.findValue })).toBeVisible();
  await page.getByRole("button", { name: m.hint, exact: true }).click();
  await expect(page.getByText(m.hintEquation)).toBeVisible();
});

test("recovers from malformed storage and starts a new explorer", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{broken"), storageKey);
  await createExplorer(page);
  await expect(page.getByText(messages("en").recovered)).toBeVisible();
});

test("previews a slider drag and preserves the unfinished puzzle when selecting a new challenge", async ({
  page,
}) => {
  const m = messages("en");
  await createExplorer(page);
  const slider = page.getByRole("slider", { name: m.difficulty });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 8 });
  await expect(page.getByRole("heading", { name: m.chooseTheme })).toBeVisible();
  expect((await saved(page)).profiles[0]!.game).toBeNull();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue("10");
  await startPuzzle(page, "en", 10);
  await page.getByLabel(m.answer, { exact: true }).fill("999");
  await page.getByRole("button", { name: m.check, exact: true }).click();
  const original = (await saved(page)).profiles[0]!.game!;
  await slider.scrollIntoViewIfNeeded();
  const gameBox = (await slider.boundingBox())!;
  await page.mouse.move(gameBox.x + gameBox.width - 8, gameBox.y + gameBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(gameBox.x + gameBox.width * 0.5, gameBox.y + gameBox.height / 2, {
    steps: 8,
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await saved(page)).profiles[0]!.game).toEqual(original);
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(slider).toHaveValue("10");
  await page.getByRole("button", { name: m.back, exact: true }).click();
  await slider.press("Home");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(slider).toHaveValue("1");
  expect((await saved(page)).profiles[0]!.game).toEqual(original);
  await page.getByRole("button", { name: m.resume, exact: true }).click();
  await expect(slider).toHaveValue("10");
});
