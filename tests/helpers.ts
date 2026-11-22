import { expect, type Page } from "@playwright/test";
import type { Locale, SavedData } from "../src/game/state";
import { messages } from "../src/i18n/messages";
import { storageKey } from "../src/storage/progress";

export async function saved(page: Page): Promise<SavedData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
}

export async function openMenu(page: Page, locale: Locale = "en") {
  await page.getByRole("button", { name: messages(locale).menu, exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: messages(locale).menu, exact: true }),
  ).toBeVisible();
}

export async function closeMenu(page: Page, locale: Locale = "en") {
  await page
    .getByRole("dialog", { name: messages(locale).menu, exact: true })
    .getByRole("button", { name: messages(locale).close, exact: true })
    .click();
}

export async function language(page: Page, from: Locale, to: Locale) {
  await openMenu(page, from);
  await page.getByRole("button", { name: to === "he" ? "עב" : "EN", exact: true }).click();
  await closeMenu(page, to);
}

export async function loadGame(page: Page, locale: Locale = "en", difficulty = 1) {
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

export async function enterAnswer(page: Page, locale: Locale, value: string) {
  await page.getByLabel(messages(locale).answer, { exact: true }).focus();
  await page.keyboard.press("Delete");
  await page.keyboard.type(value);
}

export async function solvePuzzle(page: Page, locale: Locale) {
  const m = messages(locale);
  const data = await saved(page);
  const { puzzle, step } = data.game!;
  for (const id of puzzle.symbols.slice(step)) {
    await enterAnswer(page, locale, String(puzzle.values[id]));
    await page.getByRole("button", { name: m.check, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: m.completionTitle })).toBeVisible();
}
