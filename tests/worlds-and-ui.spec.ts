import { expect, test } from "@playwright/test";
import { themes } from "../src/engine/themes";
import { messages } from "../src/i18n/messages";
import { language, loadGame, saved } from "./helpers";

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

test("custom tooltips support hover, keyboard dismissal, and Hebrew", async ({ page }) => {
  await loadGame(page);
  const brand = page.getByRole("button", { name: messages("en").chooseTheme, exact: true });
  await brand.hover();
  await expect(page.getByRole("tooltip")).toHaveText(messages("en").chooseTheme);
  await brand.focus();
  await expect(brand).toHaveAttribute("aria-describedby", /.+/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  const firstToken = page.locator("#solver-title [data-tooltip-trigger]").first();
  await firstToken.hover();
  const theme = (await saved(page)).game!.puzzle.theme;
  const themeIdx = themes.findIndex((t) => t.id === theme);
  const expectedGlyphName = messages("en").themeEmojiNames[themeIdx]![0]!;
  await expect(page.getByRole("tooltip")).toHaveText(expectedGlyphName);

  await language(page, "en", "he");
  const brandHe = page.getByRole("button", { name: messages("he").chooseTheme, exact: true });
  await brandHe.focus();
  await expect(page.getByRole("tooltip")).toHaveText(messages("he").chooseTheme);
  await brandHe.blur();
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  const firstTokenHe = page.locator("#solver-title [data-tooltip-trigger]").first();
  await firstTokenHe.hover();
  const expectedGlyphNameHe = messages("he").themeEmojiNames[themeIdx]![0]!;
  await expect(page.getByRole("tooltip")).toHaveText(expectedGlyphNameHe);

  const tooltipBox = await page.getByRole("tooltip").boundingBox();
  const viewport = page.viewportSize();
  if (tooltipBox && viewport) {
    expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
    expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
    expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(viewport.width);
    expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(viewport.height);
  }
});
