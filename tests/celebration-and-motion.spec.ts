import { expect, test } from "@playwright/test";
import { messages } from "../src/i18n/messages";
import { preferencesKey } from "../src/storage/preferences";
import { closeMenu, language, loadGame, openMenu, solvePuzzle } from "./helpers";

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

for (const locale of ["en", "he"] as const) {
  test(`celebrates completion once and settles into a readable reward in ${locale}`, async ({
    page,
  }, testInfo) => {
    await loadGame(page, locale);
    await solvePuzzle(page, locale);
    const completion = page.locator("[data-completion]");
    const particles = page.locator("[data-confetti-piece]");
    await expect(page.locator("#completion-title")).toBeFocused();
    await expect(particles).toHaveCount(32);
    const timings = await particles.evaluateAll((elements) =>
      elements.flatMap((element) =>
        element.getAnimations().map((animation) => {
          const timing = animation.effect!.getTiming();
          return {
            iterations: timing.iterations,
            end: Number(timing.duration) + (timing.delay ?? 0),
          };
        }),
      ),
    );
    expect(timings).toHaveLength(32);
    expect(timings.every(({ iterations, end }) => iterations === 1 && end <= 3000)).toBe(true);
    await expect(page.getByRole("button", { name: messages(locale).nextPuzzle })).toBeEnabled();
    await completion.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 500;
      }
    });
    await page.screenshot({
      path: testInfo.outputPath(`reward-burst-${locale}.png`),
      fullPage: true,
    });
    await completion.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) animation.play();
    });
    await expect
      .poll(() =>
        completion.evaluate(
          (element) =>
            element.getAnimations({ subtree: true }).filter((a) => a.playState !== "finished")
              .length,
        ),
      )
      .toBe(0);
    await expect(particles.first()).toHaveCSS("opacity", "0");
    await expect(page.locator("[data-reward-star]")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('[data-reaction="complete"]')
          .evaluate(
            (element) =>
              element.getAnimations({ subtree: true }).filter((a) => a.playState !== "finished")
                .length,
          ),
      )
      .toBe(0);
    await page.screenshot({
      path: testInfo.outputPath(`reward-settled-${locale}.png`),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const otherLocale = locale === "en" ? "he" : "en";
    await language(page, locale, otherLocale);
    await expect(
      page.getByRole("heading", { name: messages(otherLocale).completionTitle }),
    ).toBeVisible();
    expect(
      await completion.evaluate((element) =>
        element.getAnimations({ subtree: true }).every((a) => a.playState === "finished"),
      ),
    ).toBe(true);
    await expect(particles.first()).toHaveCSS("opacity", "0");
    await openMenu(page, otherLocale);
    await page.getByRole("switch", { name: messages(otherLocale).animations }).uncheck();
    await page.getByRole("switch", { name: messages(otherLocale).animations }).check();
    await closeMenu(page, otherLocale);
    await expect(page.locator("[data-confetti]")).toBeHidden();
    await expect(page.locator("[data-reward-star]")).toHaveCSS("animation-name", "none");
    await page.getByRole("button", { name: messages(otherLocale).nextPuzzle }).click();
    await solvePuzzle(page, otherLocale);
    await expect(page.locator("[data-confetti-piece]")).toHaveCount(32);
    await expect(
      page.getByRole("button", { name: messages(otherLocale).nextPuzzle }),
    ).toBeEnabled();
    await page.getByRole("button", { name: messages(otherLocale).nextPuzzle }).click();
    await expect(
      page.getByRole("heading", { name: messages(otherLocale).findValue }),
    ).toBeVisible();
    await expect(page.locator("[data-confetti]")).toHaveCount(0);
  });
}

for (const mode of ["preference", "reduced-motion"] as const) {
  test(`shows a static completion reward with ${mode}`, async ({ page }) => {
    await loadGame(page);
    if (mode === "preference") {
      await openMenu(page);
      await page.getByRole("switch", { name: messages("en").animations }).uncheck();
      await closeMenu(page);
      await page.reload();
      await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
    } else {
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    await solvePuzzle(page, "en");
    await expect(page.locator("[data-reward-star]")).toBeVisible();
    await expect(page.locator("[data-reward-star]")).toHaveCSS("animation-name", "none");
    await expect(page.locator("[data-confetti]")).toBeHidden();
    await expect(page.locator("[data-completion] > p")).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-reaction="complete"]')).toHaveCSS("animation-name", "none");
    await expect(page.locator("#completion-title")).toBeFocused();
    if (mode === "preference") {
      await openMenu(page);
      await page.getByRole("switch", { name: messages("en").animations }).check();
      await closeMenu(page);
    } else {
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    await expect(page.locator("[data-reward-star]")).toHaveCSS("animation-name", "none");
    await expect(page.locator("[data-confetti]")).toBeHidden();
    await page.getByRole("button", { name: messages("en").nextPuzzle }).click();
    await expect(page.getByRole("heading", { name: messages("en").findValue })).toBeVisible();
  });
}
